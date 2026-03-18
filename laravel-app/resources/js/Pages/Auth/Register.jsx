import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <h4 className="text-center mb-4">Create your account</h4>

            <form onSubmit={submit}>
                <div className="form-group mb-4">
                    <label className="form-label" htmlFor="name">
                        Name
                    </label>
                    <input
                        id="name"
                        name="name"
                        className="form-control"
                        placeholder="Enter name"
                        value={data.name}
                        autoComplete="name"
                        autoFocus
                        onChange={(e) => setData('name', e.target.value)}
                        required
                    />
                    {errors.name ? (
                        <div className="text-danger mt-2">{errors.name}</div>
                    ) : null}
                </div>

                <div className="form-group mb-4">
                    <label className="form-label" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="Enter email"
                        value={data.email}
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    {errors.email ? (
                        <div className="text-danger mt-2">{errors.email}</div>
                    ) : null}
                </div>

                <div className="form-group mb-4">
                    <label className="form-label" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="Enter password"
                        value={data.password}
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />
                    {errors.password ? (
                        <div className="text-danger mt-2">{errors.password}</div>
                    ) : null}
                </div>

                <div className="form-group mb-4">
                    <label className="form-label" htmlFor="password_confirmation">
                        Confirm Password
                    </label>
                    <input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        className="form-control"
                        placeholder="Confirm password"
                        value={data.password_confirmation}
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />
                    {errors.password_confirmation ? (
                        <div className="text-danger mt-2">
                            {errors.password_confirmation}
                        </div>
                    ) : null}
                </div>

                <div className="text-center">
                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={processing}
                    >
                        Sign Up
                    </button>
                </div>

                <div className="new-account mt-3">
                    <p>
                        Already have an account?{' '}
                        <Link className="text-primary" href={route('login')}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </form>
        </GuestLayout>
    );
}
