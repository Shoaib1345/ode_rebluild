<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'event_type'          => ['required', 'integer', 'exists:event_types,uid'],
            'event_state'         => ['required', 'string'],   // 2-char abbrev OR full name
            'persons'             => ['required', 'integer', 'min:1'],
            'event_dates'         => ['required', 'string'],   // comma-separated MM/DD/YYYY
            'timezone'            => ['nullable', 'string', 'max:50'],
            'noha'                => ['nullable', 'boolean'],
            'w_o_s'               => ['nullable', 'boolean'],
            'p_a_n_c_b'           => ['nullable', 'boolean'],
            'host_liquor'         => ['nullable', 'boolean'],
            'liquor'              => ['nullable', 'boolean'],
            'additional_insureds' => ['nullable', 'integer', 'min:0'],
            'private_residence'   => ['nullable', 'boolean'],
            'is_venue'            => ['nullable', 'boolean'],
        ];
    }
}
