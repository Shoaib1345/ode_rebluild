<?php

namespace App\Http\Controllers;

use App\Http\Requests\QuoteRequest;
use App\Models\EventType;
use App\Models\UsState;
use App\Services\QuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    public function __construct(private QuoteService $quoteService) {}

    /**
     * GET /api/event-types
     * Returns all non-client-added event types for the public quote dropdown.
     */
    public function eventTypes(): JsonResponse
    {
        $types = EventType::where('client_added', false)
            ->orderBy('event_type')
            ->get(['id', 'event_type']);

        return response()->json($types);
    }

    /**
     * GET /api/us-states
     * Returns all US states for the state selector.
     */
    public function usStates(): JsonResponse
    {
        $states = UsState::orderBy('name')
            ->get(['id', 'name', 'abbreviation']);

        return response()->json($states);
    }

    /**
     * GET /api/quote
     * Core pricing engine — returns up to 4 plan options.
     *
     * Query params: event_type, event_state, persons, event_dates,
     *               timezone, noha, w_o_s, p_a_n_c_b,
     *               host_liquor, liquor, additional_insureds,
     *               private_residence, is_venue
     */
    public function getQuote(QuoteRequest $request): JsonResponse
    {
        $plans = $this->quoteService->getQuote($request->validated());

        $hasResults = collect($plans)->contains(fn ($p) => $p !== null);

        if (! $hasResults) {
            return response()->json([
                'message' => 'No coverage available for the provided details.',
                'plans'   => $this->emptyPlans(),
            ], 200);
        }

        return response()->json(['plans' => $plans]);
    }

    /**
     * GET /api/broker-fee
     * Returns broker fee + processing fee for a given premium.
     * Used client-side when customer adjusts coverage options post-quote.
     */
    public function getBrokerFee(Request $request): JsonResponse
    {
        $request->validate([
            'premium'       => ['required', 'numeric', 'min:0'],
            'carrier'       => ['required', 'string'],
            'event_type'    => ['required', 'integer'],
            'persons'       => ['required', 'integer', 'min:1'],
            'event_dates'   => ['required', 'string'],
            'timezone'      => ['nullable', 'string'],
        ]);

        $dates    = array_map('trim', explode(',', $request->event_dates));
        $timezone = $request->timezone ?? 'America/Los_Angeles';

        $fees = $this->quoteService->calculateFees(
            (float) $request->premium,
            $request->carrier,
            (int) $request->event_type,
            (int) $request->persons,
            $dates,
            $timezone
        );

        return response()->json($fees);
    }

    private function emptyPlans(): array
    {
        return [
            'firstOption'  => null,
            'secondOption' => null,
            'thirdOption'  => null,
            'fourthOption' => null,
        ];
    }
}
