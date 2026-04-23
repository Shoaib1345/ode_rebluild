<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Page extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'navbar_text',
        'meta_keywords',
        'meta_description',
        'parent_page_id',
        'editor_content',
        'header_content',
        'content_title',
        'banner_image',
        'content_image',
        'tips_heading',
        'tip1_text',
        'tip2_text',
        'tip3_text',
        'tip1_image',
        'tip2_image',
        'tip3_image',
        'event_type_id',
        'sort_order',
        'add_to_menu',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'add_to_menu' => 'boolean',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'parent_page_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Page::class, 'parent_page_id');
    }

    public function eventType(): BelongsTo
    {
        return $this->belongsTo(EventType::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    public function scopeInMenu($query)
    {
        return $query->where('add_to_menu', true)->orderBy('sort_order');
    }
}
