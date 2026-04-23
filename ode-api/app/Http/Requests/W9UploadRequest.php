<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates an incoming W9 PDF upload.
 *
 * Rules per FULL-SPEC-V2.md §21.2:
 *   - Must be a PDF file
 *   - Max size 5 MB (5,120 KB)
 */
class W9UploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:pdf', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'A W9 PDF file is required.',
            'file.mimes'    => 'The W9 must be a PDF file.',
            'file.max'      => 'The W9 file may not be larger than 5 MB.',
        ];
    }
}
