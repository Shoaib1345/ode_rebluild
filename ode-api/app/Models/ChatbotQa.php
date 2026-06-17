<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One chatbot knowledge-base entry (trigger keywords + answer).
 *
 * @see \App\Http\Controllers\ChatbotQaController
 */
class ChatbotQa extends Model
{
    protected $table = 'chatbot_qa';

    protected $fillable = [
        'keywords',
        'answer',
        'sort_order',
    ];

    /**
     * Keywords are stored pipe-separated; expose them as a clean array.
     *
     * @return string[]
     */
    public function keywordList(): array
    {
        return collect(explode('|', (string) $this->keywords))
            ->map(fn ($k) => trim(strtolower($k)))
            ->filter()
            ->values()
            ->all();
    }
}
