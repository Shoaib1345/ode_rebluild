<?php

namespace App\Http\Controllers;

use App\Models\ChatbotQa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Chatbot knowledge base.
 *
 *   Public:  GET /api/chatbot/qa            — entries the widget loads.
 *   Admin:   GET/POST/PATCH/DELETE under /api/admin/chatbot/qa, plus CSV import.
 *
 * CSV format (matches the old in-widget uploader):
 *   header row, then `keyword1|keyword2|...,answer text` per line.
 */
class ChatbotQaController extends Controller
{
    // ── Public ───────────────────────────────────────────────────────────────────

    /**
     * GET /api/chatbot/qa
     * Entries for the public widget (keywords as arrays).
     */
    public function index(): JsonResponse
    {
        $entries = ChatbotQa::orderBy('sort_order')->orderBy('id')->get()
            ->map(fn (ChatbotQa $q) => [
                'id'       => $q->id,
                'keywords' => $q->keywordList(),
                'answer'   => $q->answer,
            ]);

        return response()->json($entries);
    }

    // ── Admin ────────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/chatbot/qa
     */
    public function adminIndex(): JsonResponse
    {
        $entries = ChatbotQa::orderBy('sort_order')->orderBy('id')->get()
            ->map(fn (ChatbotQa $q) => [
                'id'         => $q->id,
                'keywords'   => $q->keywords,
                'answer'     => $q->answer,
                'sort_order' => $q->sort_order,
                'created_at' => $q->created_at?->toIso8601String(),
            ]);

        return response()->json($entries);
    }

    /**
     * POST /api/admin/chatbot/qa
     * Add a single entry.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'keywords'   => ['required', 'string', 'max:500'],
            'answer'     => ['required', 'string'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $entry = ChatbotQa::create([
            'keywords'   => $data['keywords'],
            'answer'     => $data['answer'],
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return response()->json($entry, 201);
    }

    /**
     * PATCH /api/admin/chatbot/qa/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $entry = ChatbotQa::findOrFail($id);

        $data = $request->validate([
            'keywords'   => ['sometimes', 'string', 'max:500'],
            'answer'     => ['sometimes', 'string'],
            'sort_order' => ['sometimes', 'integer'],
        ]);

        $entry->update($data);

        return response()->json($entry);
    }

    /**
     * POST /api/admin/chatbot/qa/import
     * Bulk-import from a CSV file (`file`) or raw CSV text (`csv`).
     * Pass `replace=1` to clear existing entries first.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file'    => ['nullable', 'file', 'mimes:csv,txt', 'max:2048'],
            'csv'     => ['nullable', 'string'],
            'replace' => ['nullable', 'boolean'],
        ]);

        $raw = $request->hasFile('file')
            ? file_get_contents($request->file('file')->getRealPath())
            : (string) $request->input('csv', '');

        if (trim($raw) === '') {
            return response()->json([
                'message' => 'No CSV content provided.',
                'errors'  => ['file' => ['Please choose a CSV file or paste CSV text.']],
            ], 422);
        }

        $rows = $this->parseCsv($raw);

        if (empty($rows)) {
            return response()->json([
                'message' => 'No valid rows found. Expected: keywords,answer (with a header row).',
                'errors'  => ['file' => ['No valid rows found.']],
            ], 422);
        }

        if ($request->boolean('replace')) {
            ChatbotQa::query()->delete();
        }

        foreach ($rows as $i => [$keywords, $answer]) {
            ChatbotQa::create([
                'keywords'   => $keywords,
                'answer'     => $answer,
                'sort_order' => $i,
            ]);
        }

        return response()->json([
            'message'  => 'Imported ' . count($rows) . ' Q&A ' . (count($rows) === 1 ? 'entry' : 'entries') . '.',
            'imported' => count($rows),
        ], 201);
    }

    /**
     * DELETE /api/admin/chatbot/qa/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        ChatbotQa::findOrFail($id)->delete();

        return response()->json(['message' => 'Entry deleted.']);
    }

    /**
     * DELETE /api/admin/chatbot/qa
     * Clear all entries.
     */
    public function clear(): JsonResponse
    {
        ChatbotQa::query()->delete();

        return response()->json(['message' => 'All chatbot entries cleared.']);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    /**
     * Parse CSV into [keywords, answer] pairs. Skips the header row and any line
     * without both columns. Keyword cell is left as-is (pipe-separated phrases).
     *
     * @return array<int, array{0:string,1:string}>
     */
    private function parseCsv(string $raw): array
    {
        $lines = preg_split('/\r\n|\r|\n/', trim($raw));
        $out   = [];

        foreach ($lines as $i => $line) {
            if (trim($line) === '') {
                continue;
            }
            if ($i === 0) {
                continue; // header row
            }

            $cells = str_getcsv($line);
            $keywords = trim($cells[0] ?? '');
            $answer   = trim($cells[1] ?? '');

            if ($keywords !== '' && $answer !== '') {
                $out[] = [$keywords, $answer];
            }
        }

        return $out;
    }
}
