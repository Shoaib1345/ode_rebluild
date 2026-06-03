<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Customer / lead support chat — admin side.
 *
 * A "conversation" is a lead that has at least one message. Admins/CSRs see an
 * inbox of conversations (with unread inbound counts), open a thread, and reply.
 * Inbound messages are marked read the moment a thread is opened.
 *
 * Moderation: admins can block a customer's chat, close/reopen a conversation,
 * delete individual messages, and post internal notes (never shown to the
 * customer).
 */
class ChatController extends Controller
{
    /**
     * GET /api/admin/chat
     *
     * Inbox of conversations. ?status = open (default) | closed | all.
     * ?search filters by name/email/event.
     */
    public function conversations(Request $request): JsonResponse
    {
        $request->validate([
            'search'   => ['nullable', 'string', 'max:100'],
            'status'   => ['nullable', 'in:open,closed,all'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $search = trim((string) $request->input('search', ''));
        $status = $request->input('status', 'open');

        $query = Lead::query()
            ->whereHas('messages')
            ->withCount(['messages as unread_count' => function ($q) {
                $q->where('direction', LeadMessage::DIRECTION_IN)->whereNull('read_at');
            }])
            ->withMax('messages as last_message_at', 'created_at');

        if ($status === 'open') {
            $query->whereNull('chat_closed_at');
        } elseif ($status === 'closed') {
            $query->whereNotNull('chat_closed_at');
        }

        if ($search !== '') {
            $like = '%' . $search . '%';
            $query->where(function ($q) use ($like) {
                $q->where('first_name', 'like', $like)
                  ->orWhere('last_name', 'like', $like)
                  ->orWhere('email', 'like', $like)
                  ->orWhere('event_name', 'like', $like);
            });
        }

        $leads = $query
            ->orderByDesc('last_message_at')
            ->paginate((int) $request->input('per_page', 20));

        $leads->getCollection()->transform(function (Lead $lead) {
            $last = $lead->messages()->latest()->first();

            return [
                'lead_id'         => $lead->id,
                'name'            => $this->displayName($lead),
                'email'           => $lead->email,
                'event_name'      => $lead->event_name,
                'unread_count'    => (int) $lead->unread_count,
                'is_blocked'      => (bool) $lead->is_chat_blocked,
                'is_closed'       => $lead->chat_closed_at !== null,
                'last_message'    => $last ? [
                    'body'        => Str::limit($last->body, 120),
                    'direction'   => $last->direction,
                    'is_internal' => (bool) $last->is_internal,
                    'at'          => $last->created_at->toIso8601String(),
                ] : null,
                'last_message_at' => $lead->last_message_at
                    ? Carbon::parse($lead->last_message_at)->toIso8601String()
                    : null,
            ];
        });

        return response()->json($leads);
    }

    /**
     * GET /api/admin/chat/unread-count
     */
    public function unreadCount(): JsonResponse
    {
        $count = LeadMessage::query()
            ->where('direction', LeadMessage::DIRECTION_IN)
            ->whereNull('read_at')
            ->count();

        return response()->json(['unread_count' => $count]);
    }

    /**
     * GET /api/admin/chat/{leadId}
     *
     * Full thread (including internal notes). Opening it marks inbound read.
     */
    public function thread(Request $request, int $leadId): JsonResponse
    {
        $lead = Lead::findOrFail($leadId);

        $lead->messages()
             ->where('direction', LeadMessage::DIRECTION_IN)
             ->whereNull('read_at')
             ->update(['read_at' => now()]);

        $messages = $lead->messages()
            ->with('sender:id,first_name,last_name')
            ->orderBy('created_at')
            ->get()
            ->map(fn (LeadMessage $m) => $this->formatMessage($m));

        return response()->json([
            'lead'     => $this->leadHeader($lead),
            'messages' => $messages,
        ]);
    }

    /**
     * POST /api/admin/chat/{leadId}
     *
     * Send a reply (or an internal note when is_internal = true). A normal reply
     * reopens a closed conversation; an internal note never does.
     */
    public function send(Request $request, int $leadId): JsonResponse
    {
        $data = $request->validate([
            'body'        => ['required', 'string', 'max:5000'],
            'is_internal' => ['nullable', 'boolean'],
        ]);

        $lead     = Lead::findOrFail($leadId);
        $internal = (bool) ($data['is_internal'] ?? false);

        $message = $lead->messages()->create([
            'user_id'     => $request->user()->id,
            'direction'   => LeadMessage::DIRECTION_OUT,
            'is_internal' => $internal,
            'body'        => $data['body'],
        ]);

        // A real reply reopens a closed conversation.
        if (! $internal && $lead->chat_closed_at !== null) {
            $lead->update(['chat_closed_at' => null]);
        }

        $message->load('sender:id,first_name,last_name');

        return response()->json($this->formatMessage($message), 201);
    }

    /**
     * PATCH /api/admin/chat/{leadId}/settings
     *
     * Block/unblock the chat and/or close/reopen the conversation.
     */
    public function updateSettings(Request $request, int $leadId): JsonResponse
    {
        $data = $request->validate([
            'is_blocked' => ['nullable', 'boolean'],
            'is_closed'  => ['nullable', 'boolean'],
        ]);

        $lead = Lead::findOrFail($leadId);
        $patch = [];

        if (array_key_exists('is_blocked', $data) && $data['is_blocked'] !== null) {
            $patch['is_chat_blocked'] = (bool) $data['is_blocked'];
        }
        if (array_key_exists('is_closed', $data) && $data['is_closed'] !== null) {
            $patch['chat_closed_at'] = $data['is_closed'] ? now() : null;
        }

        if (! empty($patch)) {
            $lead->update($patch);
        }

        return response()->json($this->leadHeader($lead->fresh()));
    }

    /**
     * DELETE /api/admin/chat/{leadId}/messages/{messageId}
     *
     * Soft-delete a single message (removes it from both admin + customer views).
     */
    public function deleteMessage(int $leadId, int $messageId): JsonResponse
    {
        $message = LeadMessage::where('lead_id', $leadId)->findOrFail($messageId);
        $message->delete();

        return response()->json(['message' => 'Message deleted.']);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private function leadHeader(Lead $lead): array
    {
        return [
            'id'         => $lead->id,
            'name'       => $this->displayName($lead),
            'email'      => $lead->email,
            'phone'      => $lead->phone,
            'event_name' => $lead->event_name,
            'event_date' => $lead->event_date?->toDateString(),
            'is_blocked' => (bool) $lead->is_chat_blocked,
            'is_closed'  => $lead->chat_closed_at !== null,
        ];
    }

    private function formatMessage(LeadMessage $m): array
    {
        return [
            'id'          => $m->id,
            'direction'   => $m->direction,
            'body'        => $m->body,
            'is_internal' => (bool) $m->is_internal,
            'sender_id'   => $m->user_id,
            'sender_name' => $m->sender?->full_name,
            'read_at'     => $m->read_at?->toIso8601String(),
            'created_at'  => $m->created_at->toIso8601String(),
        ];
    }

    private function displayName(Lead $lead): string
    {
        $name = trim(($lead->first_name ?? '') . ' ' . ($lead->last_name ?? ''));

        return $name !== '' ? $name : ($lead->email ?? 'Lead #' . $lead->id);
    }
}
