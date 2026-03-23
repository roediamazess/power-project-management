<?php

namespace App\Support;

use ZipArchive;

class XlsxReader
{
    public function readFirstSheet(string $path): array
    {
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            throw new \RuntimeException('Tidak bisa membuka file xlsx: ' . $path);
        }

        $sharedStrings = $this->readSharedStrings($zip);
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if ($sheetXml === false) {
            $sheetXml = $zip->getFromName('xl/worksheets/sheet.xml');
        }
        if ($sheetXml === false) {
            $zip->close();
            throw new \RuntimeException('Sheet1 tidak ditemukan di xlsx.');
        }

        $xml = @simplexml_load_string($sheetXml);
        if (! $xml) {
            $zip->close();
            throw new \RuntimeException('Gagal parse sheet XML.');
        }

        $rows = [];
        $maxCol = 0;

        foreach ($xml->sheetData->row as $rowNode) {
            $row = [];
            foreach ($rowNode->c as $cell) {
                $ref = (string) $cell['r'];
                $colLetters = preg_replace('/\d+/', '', $ref);
                $colIndex = $this->colLettersToIndex($colLetters);
                $maxCol = max($maxCol, $colIndex);

                $type = (string) ($cell['t'] ?? '');
                $value = null;

                if ($type === 's') {
                    $idx = (int) ((string) $cell->v);
                    $value = $sharedStrings[$idx] ?? null;
                } elseif ($type === 'inlineStr') {
                    $value = isset($cell->is->t) ? (string) $cell->is->t : null;
                } else {
                    $value = isset($cell->v) ? (string) $cell->v : null;
                }

                $row[$colIndex] = $value;
            }

            if (! empty($row)) {
                $rows[] = $row;
            }
        }

        $zip->close();

        $normalized = [];
        foreach ($rows as $r) {
            $line = [];
            for ($i = 1; $i <= $maxCol; $i++) {
                $line[] = array_key_exists($i, $r) ? $r[$i] : null;
            }
            $normalized[] = $line;
        }

        return $normalized;
    }

    private function readSharedStrings(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');
        if ($xml === false) {
            return [];
        }

        $doc = @simplexml_load_string($xml);
        if (! $doc) {
            return [];
        }

        $strings = [];
        foreach ($doc->si as $si) {
            if (isset($si->t)) {
                $strings[] = (string) $si->t;
                continue;
            }

            $text = '';
            if (isset($si->r)) {
                foreach ($si->r as $run) {
                    if (isset($run->t)) {
                        $text .= (string) $run->t;
                    }
                }
            }
            $strings[] = $text !== '' ? $text : null;
        }

        return $strings;
    }

    private function colLettersToIndex(string $letters): int
    {
        $letters = strtoupper($letters);
        $len = strlen($letters);
        $num = 0;
        for ($i = 0; $i < $len; $i++) {
            $num = $num * 26 + (ord($letters[$i]) - 64);
        }
        return $num;
    }
}

