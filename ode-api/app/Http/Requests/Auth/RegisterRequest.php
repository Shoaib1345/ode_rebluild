<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:55'],
            'last_name'  => ['required', 'string', 'max:55'],
            'email'      => ['required', 'email', 'max:155', 'unique:users,email'],
            'password'   => ['required', 'confirmed', Password::min(8)],
            'phone'      => ['nullable', 'string', 'max:20'],
        ];
    }
}
