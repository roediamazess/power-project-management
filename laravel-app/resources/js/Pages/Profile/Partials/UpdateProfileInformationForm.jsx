import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const compressPhoto = async (file) => {
        if (!(file instanceof File)) return null;
        if (!file.type?.startsWith('image/')) return file;

        const maxBytes = 300 * 1024;
        const maxDim = 512;

        const loadBitmap = async () => {
            if (typeof createImageBitmap === 'function') {
                return await createImageBitmap(file);
            }

            const img = new Image();
            const src = URL.createObjectURL(file);
            try {
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = src;
                });
            } finally {
                URL.revokeObjectURL(src);
            }
            return img;
        };

        const toJpegBlob = (canvas, quality) =>
            new Promise((resolve) => {
                if (canvas.toBlob) {
                    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
                    return;
                }
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                fetch(dataUrl)
                    .then((r) => r.blob())
                    .then((b) => resolve(b))
                    .catch(() => resolve(null));
            });

        const bitmap = await loadBitmap();
        const w = bitmap.width || bitmap.naturalWidth || 0;
        const h = bitmap.height || bitmap.naturalHeight || 0;
        if (!w || !h) return file;

        const scale = Math.min(1, maxDim / Math.max(w, h));
        const outW = Math.max(1, Math.round(w * scale));
        const outH = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return file;

        ctx.drawImage(bitmap, 0, 0, outW, outH);

        let quality = 0.85;
        let blob = await toJpegBlob(canvas, quality);
        while (blob && blob.size > maxBytes && quality > 0.45) {
            quality -= 0.1;
            blob = await toJpegBlob(canvas, quality);
        }

        if (!blob) return file;
        if (blob.size >= file.size) return file;

        const nameBase = (file.name || 'profile').replace(/\.[^.]+$/, '');
        return new File([blob], `${nameBase}.jpg`, { type: 'image/jpeg' });
    };

    const {
        data: photoData,
        setData: setPhotoData,
        post: postPhoto,
        delete: deletePhoto,
        errors: photoErrors,
        processing: photoProcessing,
        recentlySuccessful: photoRecentlySuccessful,
        reset: resetPhoto,
    } = useForm({
        photo: null,
    });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    const submitPhoto = (e) => {
        e.preventDefault();
        postPhoto(route('profile.photo.update'), {
            forceFormData: true,
            onSuccess: () => resetPhoto(),
        });
    };

    const removePhoto = () => {
        deletePhoto(route('profile.photo.destroy'), {
            preserveScroll: true,
            onSuccess: () => resetPhoto(),
        });
    };

    const avatarSrc = user?.profile_photo_url || '/images/user.jpg';

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submitPhoto} className="mt-6 space-y-6">
                <div className="flex items-center gap-4">
                    <img src={avatarSrc} alt="" className="h-16 w-16 rounded-full object-cover" />
                    <div className="flex-1">
                        <InputLabel htmlFor="photo" value="Profile Photo" />
                        <input
                            id="photo"
                            type="file"
                            accept="image/*"
                            className="mt-1 block w-full"
                            onChange={async (e) => {
                                const f = e.target.files?.[0] ?? null;
                                if (!f) {
                                    setPhotoData('photo', null);
                                    return;
                                }
                                const next = await compressPhoto(f);
                                setPhotoData('photo', next);
                            }}
                        />
                        <InputError className="mt-2" message={photoErrors.photo} />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={photoProcessing || !photoData.photo}>Upload</PrimaryButton>

                    {user?.profile_photo_url ? (
                        <button type="button" className="text-sm text-gray-600 underline hover:text-gray-900" onClick={removePhoto} disabled={photoProcessing}>
                            Remove photo
                        </button>
                    ) : null}

                    <Transition
                        show={photoRecentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
