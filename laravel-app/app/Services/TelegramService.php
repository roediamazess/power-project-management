<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class TelegramService
{
    public function sendMessage(string $text, ?string $chatId = null): array
    {
        $token = (string) env('TELEGRAM_BOT_TOKEN', '');
        $chatId = $chatId ?? (string) env('TELEGRAM_CHAT_ID', '');

        if ($token === '' || $chatId === '') {
            return [
                'ok' => false,
                'error' => 'Telegram belum dikonfigurasi (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).',
            ];
        }

        $base = rtrim('https://api.telegram.org/bot' . $token, '/');

        $resp = Http::asForm()
            ->timeout(20)
            ->post($base . '/sendMessage', [
                'chat_id' => $chatId,
                'text' => $text,
                'disable_web_page_preview' => true,
            ]);

        if (! $resp->ok()) {
            return [
                'ok' => false,
                'error' => 'Telegram HTTP ' . $resp->status(),
            ];
        }

        $json = $resp->json();
        if (! is_array($json) || ($json['ok'] ?? false) !== true) {
            return [
                'ok' => false,
                'error' => 'Telegram response tidak valid.',
            ];
        }

        return [
            'ok' => true,
        ];
    }
}

