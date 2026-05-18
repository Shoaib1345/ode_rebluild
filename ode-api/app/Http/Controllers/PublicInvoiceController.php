<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\LeadAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Exception\CardException;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class PublicInvoiceController extends Controller
{
    /**
     * GET /api/invoice/{encode_id}
     *
     * Public — no auth required.
     * Returns the invoice details needed to render the customer payment page.
     * Never exposes internal IDs beyond what the customer needs.
     */
    public function show(Request $request, string $encodeId): JsonResponse
    {
        $invoice = Invoice::where('encode_id', $encodeId)
            ->with(['lineItems', 'coverageLines'])
            ->firstOrFail();

        // Track customer view — once per IP per invoice (throttle to avoid spam)
        if ($invoice->lead_id) {
            $ip        = $request->ip();
            $cacheKey  = "invoice_viewed:{$invoice->id}:{$ip}";
            $alreadyLogged = \Illuminate\Support\Facades\Cache::has($cacheKey);
            if (! $alreadyLogged) {
                LeadAction::log(
                    $invoice->lead_id,
                    LeadAction::INVOICE_VIEWED,
                    "Customer viewed invoice #{$invoice->id} on the payment page",
                    null,
                    ['invoice_id' => $invoice->id, 'ip' => $ip]
                );
                // Cache for 2 hours so repeat page loads don't spam the log
                \Illuminate\Support\Facades\Cache::put($cacheKey, true, now()->addHours(2));
            }
        }

        return response()->json([
            'encode_id'       => $invoice->encode_id,
            'type'            => $invoice->type,
            'first_name'      => $invoice->first_name,
            'last_name'       => $invoice->last_name,
            'email'           => $invoice->email,
            'event_type'      => $invoice->event_type,
            'carrier'         => $invoice->carrier,
            'effective_date'  => $invoice->effective_date?->toDateString(),
            'expiration_date' => $invoice->expiration_date?->toDateString(),
            'min_limit'       => $invoice->min_limit,
            'max_limit'       => $invoice->max_limit,
            'broker_fee'      => $invoice->broker_fee,
            'processing_fee'  => $invoice->processing_fee,
            'total_premium'   => $invoice->total_premium,
            'total_payable'   => $invoice->total_payable,
            'street'          => $invoice->street,
            'city'            => $invoice->city,
            'state'           => $invoice->state,
            'zip'             => $invoice->zip,
            'invoice_status'  => $invoice->invoice_status,
            'line_items'      => $invoice->lineItems->map(fn ($l) => [
                'fee_type'  => $l->fee_type,
                'amount'    => $l->amount,
                'quantity'  => $l->quantity,
            ]),
            'coverage_lines' => $invoice->coverageLines->map(fn ($c) => [
                'benefit_type'  => $c->benefit_type,
                'benefit_value' => $c->benefit_value,
            ]),
        ]);
    }

    /**
     * POST /api/invoice/{encode_id}/pay
     *
     * Public — no auth required.
     * Charges the customer's card via Stripe and marks the invoice as paid.
     */
    public function pay(Request $request, string $encodeId): JsonResponse
    {
        $invoice = Invoice::where('encode_id', $encodeId)->firstOrFail();

        if ($invoice->invoice_status === Invoice::STATUS_PAID) {
            return response()->json(['message' => 'This invoice has already been paid.'], 422);
        }

        $request->validate([
            'stripe_payment_method_id' => ['required', 'string'],
        ]);

        $amountCents = (int) round((float) $invoice->total_payable * 100);

        try {
            Stripe::setApiKey(config('services.stripe.secret'));

            $intent = PaymentIntent::create([
                'amount'               => $amountCents,
                'currency'             => 'usd',
                'payment_method'       => $request->input('stripe_payment_method_id'),
                'confirm'              => true,
                'automatic_payment_methods' => [
                    'enabled'         => true,
                    'allow_redirects' => 'never',
                ],
                'description'  => "ODE Invoice #{$invoice->id} – {$invoice->email}",
                'receipt_email'=> $invoice->email,
            ]);

            if ($intent->status !== 'succeeded') {
                return response()->json([
                    'message' => 'Payment was not completed. Please try again.',
                ], 422);
            }

            $invoice->update([
                'invoice_status'       => Invoice::STATUS_PAID,
                'paypal_transaction_id'=> $intent->id, // reuse this column for Stripe intent ID
            ]);

            // Activity log — payment received
            if ($invoice->lead_id) {
                LeadAction::log(
                    $invoice->lead_id,
                    LeadAction::INVOICE_PAID,
                    "Payment of \${$invoice->total_payable} received for invoice #{$invoice->id}",
                    null,
                    [
                        'invoice_id'   => $invoice->id,
                        'amount'       => $invoice->total_payable,
                        'stripe_id'    => $intent->id,
                        'customer_email' => $invoice->email,
                    ]
                );
            }

        } catch (CardException $e) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Your card was declined.',
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Invoice Stripe charge failed', [
                'invoice_id' => $invoice->id,
                'error'      => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Payment processing error. Please try again.',
            ], 422);
        }

        return response()->json([
            'message'   => 'Payment successful. Thank you!',
            'encode_id' => $invoice->encode_id,
        ]);
    }
}
