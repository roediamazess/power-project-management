<?php

namespace App\Support;

final class PermissionCatalog
{
    public static function groups(): array
    {
        return [
            [
                'key' => 'partners',
                'label' => 'Partners',
                'items' => [
                    ['key' => 'partners.view', 'label' => 'View'],
                    ['key' => 'partners.create', 'label' => 'Create'],
                    ['key' => 'partners.update', 'label' => 'Update'],
                    ['key' => 'partners.delete', 'label' => 'Delete'],
                ],
            ],
            [
                'key' => 'partner_setup',
                'label' => 'Partner Setup',
                'items' => [
                    ['key' => 'partner_setup.view', 'label' => 'View'],
                    ['key' => 'partner_setup.create', 'label' => 'Create'],
                    ['key' => 'partner_setup.update', 'label' => 'Update'],
                    ['key' => 'partner_setup.delete', 'label' => 'Delete'],
                ],
            ],

            [
                'key' => 'projects',
                'label' => 'Projects',
                'items' => [
                    ['key' => 'projects.view', 'label' => 'View'],
                    ['key' => 'projects.create', 'label' => 'Create'],
                    ['key' => 'projects.update', 'label' => 'Update'],
                    ['key' => 'projects.delete', 'label' => 'Delete'],
                ],
            [
                'key' => 'time_boxing',
                'label' => 'Time Boxing',
                'items' => [
                    ['key' => 'time_boxing.view', 'label' => 'View'],
                    ['key' => 'time_boxing.create', 'label' => 'Create'],
                    ['key' => 'time_boxing.update', 'label' => 'Update'],
                    ['key' => 'time_boxing.delete', 'label' => 'Delete'],
                ],
            ],
            [
                'key' => 'time_boxing_setup',
                'label' => 'Time Boxing Setup',
                'items' => [
                    ['key' => 'time_boxing_setup.view', 'label' => 'View'],
                    ['key' => 'time_boxing_setup.create', 'label' => 'Create'],
                    ['key' => 'time_boxing_setup.update', 'label' => 'Update'],
                    ['key' => 'time_boxing_setup.delete', 'label' => 'Delete'],
                ],
            ],

            ],
            [
                'key' => 'project_setup',
                'label' => 'Project Setup',
                'items' => [
                    ['key' => 'project_setup.view', 'label' => 'View'],
                    ['key' => 'project_setup.create', 'label' => 'Create'],
                    ['key' => 'project_setup.update', 'label' => 'Update'],
                    ['key' => 'project_setup.delete', 'label' => 'Delete'],
                ],
            ],
            [
                'key' => 'audit_logs',
                'label' => 'Audit Logs',
                'items' => [
                    ['key' => 'audit_logs.view', 'label' => 'View'],
                ],
            ],
            [
                'key' => 'user_management',
                'label' => 'User Management',
                'items' => [
                    ['key' => 'user_management.view', 'label' => 'View'],
                    ['key' => 'user_management.create', 'label' => 'Create'],
                    ['key' => 'user_management.update', 'label' => 'Update'],
                    ['key' => 'user_management.delete', 'label' => 'Delete'],
                ],
            ],
            [
                'key' => 'access_control',
                'label' => 'Access Control',
                'items' => [
                    ['key' => 'access_control.manage', 'label' => 'Manage Role Permissions'],
                ],
            ],
        ];
    }

    public static function allPermissionKeys(): array
    {
        $keys = [];
        foreach (self::groups() as $group) {
            foreach ($group['items'] as $item) {
                $keys[] = $item['key'];
            }
        }
        return $keys;
    }
}
