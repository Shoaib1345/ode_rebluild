<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendInvoiceEmail;
use App\Models\Invoice;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    /**
     * GET /api/admin/invoices
     *
     * Query params: search, status (0|1), lead_id, per_page, page, sort, dir
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status'   => ['nullable', Rule::in(['0', '1'])],
            'lead_id'  => ['nullable', 'integer'],
            'search'   => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort'     => ['nullable', Rule::in(['id', 'email', 'created_at', 'total_payable', 'invoice_status'])],
            'dir'      => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $query = Invoice::query()->with(['lead:id,event_name', 'createdBy:id,first_name,last_name']);

        if ($request->filled('status')) {
            $query->where('invoice_status', $request->input('status'));
        }

        if ($request->filled('lead_id')) {
            $query->where('lead_id', $request->input('lead_id'));
        }

        if ($search = $request->input('search')) {
            $like = '%' . $search . '%';
            $query->where(function ($q) use ($like) {
                $q->where('email',      'like', $like)
                  ->orWhere('first_name','like', $like)
                  ->orWhere('last_name', 'like', $like);
            });
        }

        $sort = $request->input('sort', 'created_at');
        $dir  = $request->input('dir',  'desc');
        $query->orderBy($sort, $dir);

        $perPage = (int) $request->input('per_page', 25);

        return response()->json(
            $query->paginate($perPage, [
                'id', 'lead_id', 'type', 'encode_id',
                'first_name', 'last_name', 'email',
                'event_type', 'carrier', 'effective_date',
                'min_limit', 'max_limit', 'total_payable',
                'invoice_status', 'created_by', 'created_at',
            ])
        );
    }

    /**
     * POST /api/admin/invoices
     * Creates a new invoice with optional line items and coverage lines.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lead_id'          => ['nullable', 'integer', 'exists:leads,id'],
            'type'             => ['required', Rule::in(['single', 'multi_plan'])],
            'first_name'       => ['required', 'string', 'max:100'],
            'last_name'        => ['required', 'string', 'max:100'],
            'email'            => ['required', 'email'],
            'email_cc'         => ['nullable', 'email'],
            'email_bcc'        => ['nullable', 'email'],
            'email_subject'    => ['nullable', 'string', 'max:155'],
            'event_type'       => ['nullable', 'string', 'max:155'],
            'carrier'          => ['nullable', 'string', 'max:55'],
            'effective_date'   => ['nullable', 'date'],
            'expiration_date'  => ['nullable', 'date'],
            'min_limit'        => ['nullable', 'integer'],
            'max_limit'        => ['nullable', 'integer'],
            'broker_fee'       => ['nullable', 'numeric', 'min:0'],
            'processing_fee'   => ['nullable', 'numeric', 'min:0'],
            'total_premium'    => ['nullable', 'numeric', 'min:0'],
            'total_payable'    => ['required', 'numeric', 'min:0'],
            'street'           => ['nullable', 'string', 'max:150'],
            'suite'            => ['nullable', 'string', 'max:100'],
            'city'             => ['nullable', 'string', 'max:55'],
            'state'            => ['nullable', 'string', 'size:2'],
            'zip'              => ['nullable', 'string', 'max:10'],
            'plans'            => ['nullable', 'array'],
            // Line items (nested)
            'line_items'                 => ['nullable', 'array'],
            'line_items.*.fee_type'      => ['required', 'string', 'max:50'],
            'line_items.*.amount'        => ['required', 'numeric', 'min:0'],
            'line_items.*.quantity'      => ['nullable', 'integer', 'min:1'],
            'line_items.*.policy'        => ['nullable', 'string', 'max:155'],
            // Coverage lines (nested)
            'coverage_lines'                   => ['nullable', 'array'],
            'coverage_lines.*.benefit_type'    => ['required', 'string', 'max:155'],
            'coverage_lines.*.benefit_value'   => ['required', 'string', 'max:55'],
        ]);

        // Auto-generate unique public token
        do {
            $encodeId = Str::random(32);
        } while (Invoice::where('encode_id', $encodeId)->exists());

        $invoice = Invoice::create([
            ...$data,
            'encode_id'    => $encodeId,
            'created_by'   => $request->user()->id,
            'user_timezone'=> $request->header('X-Timezone'),
        ]);

        // Nested line items
        if (! empty($data['line_items'])) {
            foreach ($data['line_items'] as $item) {
                $invoice->lineItems()->create([
                    'fee_type' => $item['fee_type'],
                    'amount'   => $item['amount'],
                    'quantity' => $item['quantity'] ?? 1,
                    'policy'   => $item['policy']   ?? null,
                ]);
            }
        }

        // Nested coverage lines
        if (! empty($data['coverage_lines'])) {
            foreach ($data['coverage_lines'] as $line) {
                $invoice->coverageLines()->create([
                    'benefit_type'  => $line['benefit_type'],
                    'benefit_value' => $line['benefit_value'],
                ]);
            }
        }

        $invoice->load(['lineItems', 'coverageLines', 'lead:id,event_name', 'createdBy:id,first_name,last_name']);

        // Queue invoice email to recipient
        SendInvoiceEmail::dispatch($invoice);

        return response()->json($invoice, 201);
    }

    /**
     * GET /api/admin/invoices/{id}
     */
    public function show(int $id): JsonResponse
    {
        $invoice = Invoice::with(['lineItems', 'coverageLines', 'lead:id,event_name,email,first_name,last_name', 'createdBy:id,first_name,last_name'])
            ->findOrFail($id);

        return response()->json($invoice);
    }

    /**
     * PATCH /api/admin/invoices/{id}
     * Updates invoice status or basic fields.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);

        $data = $request->validate([
            'invoice_status' => ['sometimes', Rule::in([0, 1])],
            'email_subject'  => ['sometimes', 'nullable', 'string', 'max:155'],
            'email_cc'       => ['sometimes', 'nullable', 'email'],
            'email_bcc'      => ['sometimes', 'nullable', 'email'],
        ]);

        $invoice->update($data);

        return response()->json($invoice->fresh(['lineItems', 'coverageLines']));
    }

    /**
     * DELETE /api/admin/invoices/{id}
     * Hard-delete — invoices have no soft deletes.
     */
    public function destroy(int $id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);

        // Don't allow deleting paid invoices
        if ($invoice->invoice_status === Invoice::STATUS_PAID) {
            return response()->json(['message' => 'Cannot delete a paid invoice.'], 422);
        }

        $invoice->delete();

        return response()->json(null, 204);
    }
}
