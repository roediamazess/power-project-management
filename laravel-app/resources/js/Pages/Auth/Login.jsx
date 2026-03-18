import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <h4 className="text-center mb-4">Sign in your account</h4>

            {status ? <div className="alert alert-success">{status}</div> : null}

            <form onSubmit={submit}>
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
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email ? (
                        <div className="text-danger mt-2">{errors.email}</div>
                    ) : null}
                </div>

                <div className="mb-sm-4 mb-3 position-relative">
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
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    {errors.password ? (
                        <div className="text-danger mt-2">{errors.password}</div>
                    ) : null}
                </div>

                <div className="form-row d-flex flex-wrap justify-content-between mb-2">
                    <div className="form-group mb-sm-4 mb-1">
                        <div className="form-check custom-checkbox ms-1">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="remember"
                                checked={data.remember}
                                onChange={(e) =>
                                    setData('remember', e.target.checked)
                                }
                            />
                            <label className="form-check-label" htmlFor="remember">
                                Remember me
                            </label>
                        </div>
                    </div>
                    <div className="form-group ms-2">
                        {canResetPassword ? (
                            <Link href={route('password.request')}>
                                Forgot Password?
                            </Link>
                        ) : null}
                    </div>
                </div>

                <div className="text-center">
                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={processing}
                    >
                        Sign In
                    </button>
                </div>

                <div className="new-account mt-3">
                    <p>
                        Don&apos;t have an account?{' '}
                        <Link className="text-primary" href={route('register')}>
                            Sign up
                        </Link>
                    </p>
                </div>
            </form>
        </GuestLayout>
    );
}
