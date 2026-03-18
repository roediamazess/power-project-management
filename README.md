This repo saat ini punya 2 aplikasi:

- Next.js (legacy UI/template) di root repo
- Laravel 12 + Inertia (React) di folder `laravel-app/` (ini yang akan jadi aplikasi utama)

## Getting Started

### Next.js (legacy)

Run development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Laravel 12 + Inertia (React) — Local Run

#### Production-like via Docker (disarankan)

Di root repo:

```powershell
docker compose -f laravel-app\docker-compose.local.yml up -d --build
```

Buka:

- http://localhost:8080

Status & log:

```powershell
docker compose -f laravel-app\docker-compose.local.yml ps
docker compose -f laravel-app\docker-compose.local.yml logs -f app
docker compose -f laravel-app\docker-compose.local.yml logs -f web
```

Stop:

```powershell
docker compose -f laravel-app\docker-compose.local.yml down
```

Reset database (hapus volume):

```powershell
docker compose -f laravel-app\docker-compose.local.yml down -v
docker compose -f laravel-app\docker-compose.local.yml up -d --build
```

#### Dev cepat (tanpa stack DB)

Di root repo:

```powershell
docker run --rm -p 8000:8000 -v C:/Website/power-project-management/laravel-app:/app -w /app php:8.4-cli sh -lc "php artisan serve --host=0.0.0.0 --port=8000"
```

Buka:

- http://localhost:8000

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
