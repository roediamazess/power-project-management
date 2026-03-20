<?php

namespace Database\Seeders;

use App\Models\PartnerSetupOption;
use Illuminate\Database\Seeder;

class PartnerAreaSubAreaSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            'Bali',
            'Bangka Belitung',
            'Banten',
            'Cambodia (Kamboja)',
            'Daerah Istimewa Yogyakarta',
            'DKI Jakarta',
            'Jambi',
            'Jawa Barat',
            'Jawa Tengah',
            'Jawa Timur',
            'Kalimantan Barat',
            'Kalimantan Selatan',
            'Kalimantan Tengah',
            'Kalimantan Timur',
            'Kalimantan Utara',
            'Kepulauan Riau',
            'Lampung',
            'Laos',
            'Maluku',
            'Nanggroe Aceh Darussalam',
            'Nusa Tenggara Barat',
            'Nusa Tenggara Timur',
            'Papua',
            'Papua Barat',
            'Papua Barat Daya',
            'Papua Tengah',
            'Riau',
            'Sulawesi Barat',
            'Sulawesi Selatan',
            'Sulawesi Tengah',
            'Sulawesi Tenggara',
            'Sulawesi Utara',
            'Sumatera Barat',
            'Sumatera Selatan',
            'Sumatera Utara',
        ];

        foreach ($areas as $area) {
            PartnerSetupOption::query()->updateOrCreate(
                ['category' => 'area', 'name' => $area],
                ['parent_name' => null, 'status' => 'Active'],
            );
        }

        $subAreasByArea = [
            'Bali' => [
                'Kabupaten Badung',
                'Kabupaten Buleleng',
                'Kabupaten Gianyar',
                'Kabupaten Karangasem',
                'Kabupaten Klungkung',
                'Kabupaten Tabanan',
                'Kota Denpasar',
            ],
            'Bangka Belitung' => [
                'Kabupaten Belitung',
                'Kota Pangkal Pinang',
            ],
            'Banten' => [
                'Kabupaten Serang',
                'Kabupaten Tangerang',
                'Kota Cilegon',
                'Kota Serang',
                'Kota Tangerang',
                'Kota Tangerang Selatan',
            ],
            'Cambodia (Kamboja)' => [
                'Preah Sihanouk',
                'Sihanoukville',
            ],
            'Daerah Istimewa Yogyakarta' => [
                'Kabupaten Gunung Kidul',
                'Kabupaten Kulon Progo',
                'Kabupaten Sleman',
                'Kota Yogyakarta',
            ],
            'DKI Jakarta' => [
                'Kota Jakarta Barat',
                'Kota Jakarta Pusat',
                'Kota Jakarta Selatan',
                'Kota Jakarta Timur',
                'Kota Jakarta Utara',
            ],
            'Jambi' => [
                'Kota Jambi',
            ],
            'Jawa Barat' => [
                'Kabupaten Bandung Barat',
                'Kabupaten Bekasi',
                'Kabupaten Bogor',
                'Kabupaten Cianjur',
                'Kabupaten Garut',
                'Kabupaten Karawang',
                'Kabupaten Sukabumi',
                'Kabupaten Tasikmalaya',
                'Kecamatan Cikarang Utara',
                'Kota Bandung',
                'Kota Bekasi',
                'Kota Bogor',
                'Kota Cirebon',
            ],
            'Jawa Tengah' => [
                'Kabupaten Banyumas',
                'Kabupaten Blora',
                'Kabupaten Cilacap',
                'Kabupaten Kebumen',
                'Kabupaten Magelang',
                'Kabupaten Pekalongan',
                'Kabupaten Semarang',
                'Kota Magelang',
                'Kota Pekalongan',
                'Kota Semarang',
                'Kota Surakarta',
                'Kota Tegal',
            ],
            'Jawa Timur' => [
                'Kabupaten Banyuwangi',
                'Kabupaten Bojonegoro',
                'Kabupaten Gresik',
                'Kabupaten Jember',
                'Kabupaten Pasuruan',
                'Kabupaten Sidoarjo',
                'Kota Batu',
                'Kota Malang',
                'Kota Surabaya',
            ],
            'Kalimantan Barat' => [
                'Kabupaten Ketapang',
                'Kota Pontianak',
                'Kota Singkawang',
            ],
            'Kalimantan Selatan' => [
                'Kota Banjar Baru',
                'Kota Banjarmasin',
            ],
            'Kalimantan Tengah' => [
                'Kota Palangka Raya',
            ],
            'Kalimantan Timur' => [
                'Kabupaten Paser',
                'Kota Balikpapan',
                'Kota Samarinda',
            ],
            'Kalimantan Utara' => [
                'Kota Tarakan',
            ],
            'Kepulauan Riau' => [
                'Kabupaten Bintan',
                'Kabupaten Kepulauan Anambas',
                'Kota Batam',
            ],
            'Lampung' => [
                'Kabupaten Lampung Tengah',
                'Kota Bandar Lampung',
            ],
            'Laos' => [
                'Vientiane',
            ],
            'Maluku' => [
                'Kota Ambon',
            ],
            'Nanggroe Aceh Darussalam' => [
                'Kabupaten Aceh Besar',
                'Kabupaten Aceh Tengah',
                'Kabupaten Aceh Timur',
                'Kota Banda Aceh',
            ],
            'Nusa Tenggara Barat' => [
                'Kabupaten Lombok Barat',
                'Kabupaten Lombok Tengah',
                'Kabupaten Lombok Utara',
                'Kota Mataram',
            ],
            'Nusa Tenggara Timur' => [
                'Kabupaten Manggarai Barat',
                'Kabupaten Sumba Barat',
                'Kota Kupang',
            ],
            'Papua' => [
                'Kabupaten Biak',
                'Kabupaten Biak Numfor',
                'Kabupaten Jayapura',
                'Kabupaten Merauke',
                'Kota Jayapura',
            ],
            'Papua Barat' => [
                'Kabupaten Manokwari',
            ],
            'Papua Barat Daya' => [
                'Kota Sorong',
            ],
            'Papua Tengah' => [
                'Kabupaten Mimika',
            ],
            'Riau' => [
                'Kabupaten Bengkalis',
                'Kabupaten Kampar',
                'Kabupaten Pelalawan',
                'Kota Dumai',
                'Kota Pekanbaru',
            ],
            'Sulawesi Barat' => [
                'Kabupaten Mamuju',
            ],
            'Sulawesi Selatan' => [
                'Kota Makassar',
            ],
            'Sulawesi Tengah' => [
                'Kabupaten Banggai',
                'Kota Palu',
            ],
            'Sulawesi Tenggara' => [
                'Kota Kendari',
            ],
            'Sulawesi Utara' => [
                'Kota Manado',
            ],
            'Sumatera Barat' => [
                'Kota Padang',
                'Kota Sawahlunto',
            ],
            'Sumatera Selatan' => [
                'Kabupaten Muara Enim',
                'Kabupaten Ogan Komering Ulu',
                'Kota Lubuk Linggau',
                'Kota Palembang',
            ],
            'Sumatera Utara' => [
                'Kabupaten Samosir',
                'Kabupaten Simalungun',
                'Kabupaten Toba',
                'Kota Medan',
                'Kota Pematang Siantar',
            ],
        ];

        foreach ($subAreasByArea as $area => $subAreas) {
            foreach ($subAreas as $subArea) {
                PartnerSetupOption::query()->updateOrCreate(
                    ['category' => 'sub_area', 'parent_name' => $area, 'name' => $subArea],
                    ['status' => 'Active'],
                );
            }
        }
    }
}
