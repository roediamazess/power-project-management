import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const page = usePage();
    const user = page.props.auth.user;
    const url = page.url;

    const headerText = useMemo(() => {
        if (typeof header === 'string') return header;
        return null;
    }, [header]);

    useEffect(() => {
        const initFillow = () => {
            const Fillow = window?.Fillow;
            if (!Fillow?.init) return;

            if (!window.__fillow_inited) {
                Fillow.init();
                window.__fillow_inited = true;
            } else {
                if (Fillow.resize) Fillow.resize();
                if (Fillow.handleMenuPosition) Fillow.handleMenuPosition();
            }
        };

        const t = setTimeout(initFillow, 50);
        return () => clearTimeout(t);
    }, [url]);

    return (
        <>
            <div id="main-wrapper">
                <div className="nav-header">
                    <Link href={route('dashboard')} className="brand-logo">
                        <svg
                            className="logo-abbr"
                            width="55"
                            height="55"
                            viewBox="0 0 100 100"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <defs>
                                <linearGradient id="ppm-blue" x1="20" y1="8" x2="80" y2="60" gradientUnits="userSpaceOnUse">
                                    <stop offset="0" stopColor="#0AA0FF" />
                                    <stop offset="1" stopColor="#5EE7FF" />
                                </linearGradient>
                                <linearGradient id="ppm-pink" x1="8" y1="30" x2="60" y2="80" gradientUnits="userSpaceOnUse">
                                    <stop offset="0" stopColor="#FF2D8F" />
                                    <stop offset="1" stopColor="#FF77C8" />
                                </linearGradient>
                                <linearGradient id="ppm-green" x1="40" y1="30" x2="92" y2="78" gradientUnits="userSpaceOnUse">
                                    <stop offset="0" stopColor="#7EEA3B" />
                                    <stop offset="1" stopColor="#B5FF75" />
                                </linearGradient>
                                <linearGradient id="ppm-yellow" x1="22" y1="45" x2="78" y2="96" gradientUnits="userSpaceOnUse">
                                    <stop offset="0" stopColor="#FFB300" />
                                    <stop offset="1" stopColor="#FFE066" />
                                </linearGradient>
                            </defs>
                            <circle cx="50" cy="28" r="28" fill="url(#ppm-blue)" fillOpacity="0.92" />
                            <circle cx="28" cy="50" r="28" fill="url(#ppm-pink)" fillOpacity="0.92" />
                            <circle cx="72" cy="50" r="28" fill="url(#ppm-green)" fillOpacity="0.92" />
                            <circle cx="50" cy="72" r="28" fill="url(#ppm-yellow)" fillOpacity="0.92" />
                        </svg>
                        <div className="brand-title">
                            <span className="brand-title-full">Power Project Management</span>
                            <span className="brand-title-short">PPM</span>
                        </div>
                    </Link>
                    <div className="nav-control">
                        <div className="hamburger">
                            <span className="line" />
                            <span className="line" />
                            <span className="line" />
                        </div>
                    </div>
                </div>

                <div className="chatbox">
                    <div className="chatbox-close" />
                    <div className="custom-tab-1">
                        <ul className="nav nav-tabs">
                            <li className="nav-item">
                                <a className="nav-link" data-bs-toggle="tab" href="#notes">
                                    Notes
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" data-bs-toggle="tab" href="#alerts">
                                    Alerts
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link active" data-bs-toggle="tab" href="#chat">
                                    Chat
                                </a>
                            </li>
                        </ul>
                        <div className="tab-content">
                            <div className="tab-pane fade" id="notes" role="tabpanel" />
                            <div className="tab-pane fade" id="alerts" role="tabpanel" />
                            <div className="tab-pane fade active show" id="chat" role="tabpanel">
                                <div className="card mb-sm-3 mb-md-0 contacts_card dlab-chat-user-box">
                                    <div className="card-header chat-list-header text-center">
                                        <div>
                                            <h6 className="mb-1">Chat List</h6>
                                            <p className="mb-0">Show All</p>
                                        </div>
                                    </div>
                                    <div className="card-body contacts_body p-0 dlab-scroll" id="DLAB_W_Contacts_Body">
                                        <ul className="contacts">
                                            <li className="dlab-chat-user">
                                                <div className="d-flex bd-highlight">
                                                    <div className="img_cont">
                                                        <img src="/images/avatar/1.jpg" className="rounded-circle user_img" alt="" />
                                                        <span className="online_icon" />
                                                    </div>
                                                    <div className="user_info">
                                                        <span>Support</span>
                                                        <p>Online</p>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="header">
                    <div className="header-content">
                        <nav className="navbar navbar-expand">
                            <div className="navbar-collapse justify-content-between">
                                <div className="header-left">
                                    <div className="dashboard_bar">
                                        {headerText ?? header ?? 'Dashboard'}
                                    </div>
                                </div>

                                <ul className="navbar-nav header-right">
                                    <li className="nav-item d-flex align-items-center">
                                        <div className="input-group search-area">
                                            <input type="text" className="form-control" placeholder="Search here..." />
                                            <span className="input-group-text">
                                                <a href="javascript:void(0)">
                                                    <i className="flaticon-381-search-2" />
                                                </a>
                                            </span>
                                        </div>
                                    </li>

                                    <li className="nav-item dropdown notification_dropdown">
                                        <a className="nav-link bell dz-theme-mode" href="javascript:void(0)">
                                            <i id="icon-light" className="fas fa-sun" />
                                            <i id="icon-dark" className="fas fa-moon" />
                                        </a>
                                    </li>

                                    <li className="nav-item dropdown notification_dropdown">
                                        <a className="nav-link" href="javascript:void(0)" data-bs-toggle="dropdown">
                                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M26.7727 10.8757C26.7043 10.6719 26.581 10.4909 26.4163 10.3528C26.2516 10.2146 26.0519 10.1247 25.8393 10.0929L18.3937 8.95535L15.0523 1.83869C14.9581 1.63826 14.8088 1.46879 14.6218 1.35008C14.4349 1.23137 14.218 1.16833 13.9965 1.16833C13.775 1.16833 13.5581 1.23137 13.3712 1.35008C13.1842 1.46879 13.0349 1.63826 12.9407 1.83869L9.59934 8.95535L2.15367 10.0929C1.9416 10.1252 1.74254 10.2154 1.57839 10.3535C1.41423 10.4916 1.29133 10.6723 1.22321 10.8757C1.15508 11.0791 1.14436 11.2974 1.19222 11.5065C1.24008 11.7156 1.34468 11.9075 1.49451 12.061L6.92067 17.6167L5.63734 25.4777C5.60232 25.6934 5.6286 25.9147 5.7132 26.1162C5.79779 26.3177 5.93729 26.4914 6.1158 26.6175C6.29432 26.7436 6.50466 26.817 6.72287 26.8294C6.94108 26.8418 7.15838 26.7926 7.35001 26.6875L14 23.0149L20.65 26.6875C20.8416 26.7935 21.0592 26.8434 21.2779 26.8316C21.4965 26.8197 21.7075 26.7466 21.8865 26.6205C22.0655 26.4944 22.2055 26.3204 22.2903 26.1186C22.3751 25.9167 22.4014 25.695 22.3662 25.4789L21.0828 17.6179L26.5055 12.061C26.6546 11.9071 26.7585 11.715 26.8056 11.5059C26.8527 11.2968 26.8413 11.0787 26.7727 10.8757Z" fill="#717579" />
                                            </svg>
                                            <span className="badge light text-white bg-secondary rounded-circle">76</span>
                                        </a>
                                        <div className="dropdown-menu dropdown-menu-end">
                                            <div className="p-3 pb-0">
                                                <div className="row">
                                                    <div className="col-xl-12 border-bottom">
                                                        <h5 className="">Related Apps</h5>
                                                    </div>
                                                    <div className="col-4 my-3">
                                                        <div className="text-center">
                                                            <div className="angular-svg">
                                                                <img src="/images/svg/angular.svg" alt="" />
                                                                <div className="content">
                                                                    <small>Angular</small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 my-3">
                                                        <div className="text-center">
                                                            <div className="angular-svg">
                                                                <img src="/images/svg/figma.svg" alt="" />
                                                                <div className="content">
                                                                    <small>Figma</small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4 my-3">
                                                        <div className="text-center">
                                                            <div className="angular-svg">
                                                                <img src="/images/svg/dribbble.svg" alt="" />
                                                                <div className="content">
                                                                    <small>Dribbble</small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4">
                                                        <div className="text-center">
                                                            <div className="angular-svg">
                                                                <img src="/images/svg/instagram.svg" alt="" />
                                                                <div className="content">
                                                                    <small>instagram</small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4">
                                                        <div className="text-center">
                                                            <div className="angular-svg">
                                                                <img src="/images/svg/laravel-2.svg" alt="" />
                                                                <div className="content">
                                                                    <small>Laravel</small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4">
                                                        <div className="text-center">
                                                            <div className="angular-svg">
                                                                <img src="/images/svg/react-2.svg" alt="" />
                                                                <div className="content">
                                                                    <small>React</small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>

                                    <li className="nav-item dropdown notification_dropdown">
                                        <a className="nav-link" href="javascript:void(0)" role="button" data-bs-toggle="dropdown">
                                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M23.3333 19.8333H23.1187C23.2568 19.4597 23.3295 19.065 23.3333 18.6666V12.8333C23.3294 10.7663 22.6402 8.75902 21.3735 7.12565C20.1068 5.49228 18.3343 4.32508 16.3333 3.80679V3.49996C16.3333 2.88112 16.0875 2.28763 15.6499 1.85004C15.2123 1.41246 14.6188 1.16663 14 1.16663C13.3812 1.16663 12.7877 1.41246 12.3501 1.85004C11.9125 2.28763 11.6667 2.88112 11.6667 3.49996V3.80679C9.66574 4.32508 7.89317 5.49228 6.6265 7.12565C5.35983 8.75902 4.67058 10.7663 4.66667 12.8333V18.6666C4.67053 19.065 4.74316 19.4597 4.88133 19.8333H4.66667C4.35725 19.8333 4.0605 19.9562 3.84171 20.175C3.62292 20.3938 3.5 20.6905 3.5 21C3.5 21.3094 3.62292 21.6061 3.84171 21.8249C4.0605 22.0437 4.35725 22.1666 4.66667 22.1666H23.3333C23.6428 22.1666 23.9395 22.0437 24.1583 21.8249C24.3771 21.6061 24.5 21.3094 24.5 21C24.5 20.6905 24.3771 20.3938 24.1583 20.175C23.9395 19.9562 23.6428 19.8333 23.3333 19.8333Z" fill="#717579" />
                                                <path d="M9.9819 24.5C10.3863 25.2088 10.971 25.7981 11.6766 26.2079C12.3823 26.6178 13.1838 26.8337 13.9999 26.8337C14.816 26.8337 15.6175 26.6178 16.3232 26.2079C17.0288 25.7981 17.6135 25.2088 18.0179 24.5H9.9819Z" fill="#717579" />
                                            </svg>
                                            <span className="badge light text-white bg-warning rounded-circle">12</span>
                                        </a>
                                        <div className="dropdown-menu dropdown-menu-end">
                                            <div id="DZ_W_Notification1" className="widget-media dlab-scroll p-3" style={{ height: 380 }}>
                                                <ul className="timeline">
                                                    <li>
                                                        <div className="timeline-panel">
                                                            <div className="media me-2">
                                                                <img alt="image" width="50" src="/images/avatar/1.jpg" />
                                                            </div>
                                                            <div className="media-body">
                                                                <h6 className="mb-1">Dr sultads Send you Photo</h6>
                                                                <small className="d-block">29 July 2020 - 02:26 PM</small>
                                                            </div>
                                                        </div>
                                                    </li>
                                                    <li>
                                                        <div className="timeline-panel">
                                                            <div className="media me-2 media-info">KG</div>
                                                            <div className="media-body">
                                                                <h6 className="mb-1">Resport created successfully</h6>
                                                                <small className="d-block">29 July 2020 - 02:26 PM</small>
                                                            </div>
                                                        </div>
                                                    </li>
                                                    <li>
                                                        <div className="timeline-panel">
                                                            <div className="media me-2 media-success">
                                                                <i className="fa fa-home" />
                                                            </div>
                                                            <div className="media-body">
                                                                <h6 className="mb-1">Reminder : Treatment Time!</h6>
                                                                <small className="d-block">29 July 2020 - 02:26 PM</small>
                                                            </div>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>
                                            <a className="all-notification" href="javascript:void(0)">
                                                See all notifications <i className="ti-arrow-end" />
                                            </a>
                                        </div>
                                    </li>

                                    <li className="nav-item dropdown notification_dropdown">
                                        <a className="nav-link bell-link" href="javascript:void(0)">
                                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M27.076 6.24662C26.962 5.48439 26.5787 4.78822 25.9955 4.28434C25.4123 3.78045 24.6679 3.50219 23.8971 3.5H4.10289C3.33217 3.50219 2.58775 3.78045 2.00456 4.28434C1.42137 4.78822 1.03803 5.48439 0.924011 6.24662L14 14.7079L27.076 6.24662Z" fill="#717579" />
                                                <path d="M14.4751 16.485C14.3336 16.5765 14.1686 16.6252 14 16.6252C13.8314 16.6252 13.6664 16.5765 13.5249 16.485L0.875 8.30025V21.2721C0.875926 22.1279 1.2163 22.9484 1.82145 23.5536C2.42659 24.1587 3.24707 24.4991 4.10288 24.5H23.8971C24.7529 24.4991 25.5734 24.1587 26.1786 23.5536C26.7837 22.9484 27.1241 22.1279 27.125 21.2721V8.29938L14.4751 16.485Z" fill="#717579" />
                                            </svg>
                                            <span className="badge light text-white bg-danger rounded-circle">76</span>
                                        </a>
                                    </li>

                                    <li className="nav-item dropdown header-profile">
                                        <a
                                            className="nav-link"
                                            href="#"
                                            role="button"
                                            data-bs-toggle="dropdown"
                                        >
                                            <img src="/images/user.jpg" width="56" alt="" />
                                        </a>
                                        <div className="dropdown-menu dropdown-menu-end">
                                            <Link href={route('profile.edit')} className="dropdown-item ai-icon">
                                                <span className="ms-2">Profile</span>
                                            </Link>
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                className="dropdown-item ai-icon"
                                            >
                                                <span className="ms-2">Logout</span>
                                            </Link>
                                            <div className="dropdown-divider" />
                                            <div className="px-3 py-2 small text-muted">
                                                {user.name}
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </nav>
                    </div>
                </div>

                <div className="dlabnav">
                    <div className="dlabnav-scroll">
                        <ul className="metismenu" id="menu">
                            <li>
                                <a className="has-arrow" href="#" aria-expanded="false">
                                    <i className="fas fa-home" />
                                    <span className="nav-text">Dashboard</span>
                                </a>
                                <ul aria-expanded="false">
                                    <li><Link href={route('dashboard')}>Dashboard</Link></li>
                                    <li><Link href={route('projects.index')}>Project</Link></li>
                                    <li><Link href={route('contacts.index')}>Contacts</Link></li>
                                    <li><Link href={route('kanban.index')}>Kanban</Link></li>
                                    <li><Link href={route('calendar.index')}>Calendar</Link></li>
                                    <li><Link href={route('messages.index')}>Messages</Link></li>
                                </ul>
                            </li>
                            <li>
                                <a className="has-arrow" href="#" aria-expanded="false">
                                    <i className="fas fa-chart-line" />
                                    <span className="nav-text">
                                        CMS <span className="badge badge-xs badge-danger ms-2">New</span>
                                    </span>
                                </a>
                                <ul aria-expanded="false">
                                    <li><Link href={route('template.show', { page: 'content' })}>Content</Link></li>
                                    <li><Link href={route('template.show', { page: 'content-add' })}>Add Content</Link></li>
                                    <li><Link href={route('template.show', { page: 'menu-1' })}>Menus</Link></li>
                                    <li><Link href={route('template.show', { page: 'email-template' })}>Email Template</Link></li>
                                    <li><Link href={route('template.show', { page: 'add-email' })}>Add Email</Link></li>
                                    <li><Link href={route('template.show', { page: 'blog' })}>Blog</Link></li>
                                    <li><Link href={route('template.show', { page: 'add-blog' })}>Add Blog</Link></li>
                                    <li><Link href={route('template.show', { page: 'blog-category' })}>Blog Category</Link></li>
                                </ul>
                            </li>
                            <li>
                                <a className="has-arrow" href="#" aria-expanded="false">
                                    <i className="fas fa-info-circle" />
                                    <span className="nav-text">Apps</span>
                                </a>
                                <ul aria-expanded="false">
                                    <li><Link href={route('template.show', { page: 'app-profile' })}>Profile</Link></li>
                                    <li><Link href={route('profile.edit')}>Edit Profile</Link></li>
                                    <li><Link href={route('template.show', { page: 'post-details' })}>Post Details</Link></li>
                                    <li>
                                        <a className="has-arrow" href="#" aria-expanded="false">Email</a>
                                        <ul aria-expanded="false">
                                            <li><Link href={route('template.show', { page: 'email-compose' })}>Compose</Link></li>
                                            <li><Link href={route('template.show', { page: 'email-inbox' })}>Inbox</Link></li>
                                            <li><Link href={route('template.show', { page: 'email-read' })}>Read</Link></li>
                                        </ul>
                                    </li>
                                    <li><Link href={route('template.show', { page: 'app-calender' })}>Calendar</Link></li>
                                    <li>
                                        <a className="has-arrow" href="#" aria-expanded="false">Shop</a>
                                        <ul aria-expanded="false">
                                            <li><Link href={route('template.show', { page: 'ecom-product-grid' })}>Product Grid</Link></li>
                                            <li><Link href={route('template.show', { page: 'ecom-product-list' })}>Product List</Link></li>
                                            <li><Link href={route('template.show', { page: 'ecom-product-detail' })}>Product Details</Link></li>
                                            <li><Link href={route('template.show', { page: 'ecom-product-order' })}>Order</Link></li>
                                            <li><Link href={route('template.show', { page: 'ecom-checkout' })}>Checkout</Link></li>
                                            <li><Link href={route('template.show', { page: 'ecom-invoice' })}>Invoice</Link></li>
                                            <li><Link href={route('template.show', { page: 'ecom-customers' })}>Customers</Link></li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                            <li>
                                <a className="has-arrow" href="#" aria-expanded="false">
                                    <i className="fas fa-chart-line" />
                                    <span className="nav-text">Charts</span>
                                </a>
                                <ul aria-expanded="false">
                                    <li><Link href={route('template.show', { page: 'chart-flot' })}>Flot</Link></li>
                                    <li><Link href={route('template.show', { page: 'chart-morris' })}>Morris</Link></li>
                                    <li><Link href={route('template.show', { page: 'chart-chartjs' })}>Chartjs</Link></li>
                                    <li><Link href={route('template.show', { page: 'chart-chartist' })}>Chartist</Link></li>
                                    <li><Link href={route('template.show', { page: 'chart-sparkline' })}>Sparkline</Link></li>
                                    <li><Link href={route('template.show', { page: 'chart-peity' })}>Peity</Link></li>
                                </ul>
                            </li>
                            <li>
                                <a className="has-arrow" href="#" aria-expanded="false">
                                    <i className="fab fa-bootstrap" />
                                    <span className="nav-text">Bootstrap</span>
                                </a>
                                <ul aria-expanded="false">
                                    <li><Link href={route('template.show', { page: 'ui-accordion' })}>Accordion</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-alert' })}>Alert</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-badge' })}>Badge</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-button' })}>Button</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-modal' })}>Modal</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-button-group' })}>Button Group</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-list-group' })}>List Group</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-card' })}>Cards</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-carousel' })}>Carousel</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-dropdown' })}>Dropdown</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-popover' })}>Popover</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-progressbar' })}>Progressbar</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-tab' })}>Tab</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-typography' })}>Typography</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-pagination' })}>Pagination</Link></li>
                                    <li><Link href={route('template.show', { page: 'ui-grid' })}>Grid</Link></li>
                                </ul>
                            </li>
                            <li>
                                <a className="has-arrow" href="#" aria-expanded="false">
                                    <i className="fas fa-heart" />
                                    <span className="nav-text">Plugins</span>
                                </a>
                                <ul aria-expanded="false">
                                    <li><Link href={route('template.show', { page: 'uc-select2' })}>Select 2</Link></li>
                                    <li><Link href={route('template.show', { page: 'uc-nestable' })}>Nestedable</Link></li>
                                    <li><Link href={route('template.show', { page: 'uc-noui-slider' })}>Noui Slider</Link></li>
                                    <li><Link href={route('template.show', { page: 'uc-sweetalert' })}>Sweet Alert</Link></li>
                                    <li><Link href={route('template.show', { page: 'uc-toastr' })}>Toastr</Link></li>
                                    <li><Link href={route('template.show', { page: 'map-jqvmap' })}>Jqv Map</Link></li>
                                    <li><Link href={route('template.show', { page: 'uc-lightgallery' })}>Light Gallery</Link></li>
                                </ul>
                            </li>
                            <li>
                                <Link href={route('template.show', { page: 'widget-basic' })} aria-expanded="false">
                                    <i className="fas fa-user" />
                                    <span className="nav-text">Widget</span>
                                </Link>
                            </li>
                            <li>
                                <a className="has-arrow" href="#" aria-expanded="false">
                                    <i className="fas fa-file-alt" />
                                    <span className="nav-text">Forms</span>
                                </a>
                                <ul aria-expanded="false">
                                    <li><Link href={route('template.show', { page: 'form-element' })}>Form Elements</Link></li>
                                    <li><Link href={route('template.show', { page: 'form-wizard' })}>Wizard</Link></li>
                                    <li><Link href={route('template.show', { page: 'form-ckeditor' })}>CkEditor</Link></li>
                                    <li><Link href={route('template.show', { page: 'form-pickers' })}>Pickers</Link></li>
                                    <li><Link href={route('template.show', { page: 'form-validation' })}>Form Validate</Link></li>
                                </ul>
                            </li>
                            <li>
                                <a className="has-arrow" href="#" aria-expanded="false">
                                    <i className="fas fa-table" />
                                    <span className="nav-text">Table</span>
                                </a>
                                <ul aria-expanded="false">
                                    <li><Link href={route('template.show', { page: 'table-bootstrap-basic' })}>Bootstrap</Link></li>
                                    <li><Link href={route('template.show', { page: 'table-datatable-basic' })}>Datatable</Link></li>
                                </ul>
                            </li>
                            <li>
                                <a className="has-arrow" href="#" aria-expanded="false">
                                    <i className="fas fa-clone" />
                                    <span className="nav-text">Pages</span>
                                </a>
                                <ul aria-expanded="false">
                                    <li><Link href={route('login')}>Login</Link></li>
                                    <li><Link href={route('register')}>Register</Link></li>
                                    <li>
                                        <a className="has-arrow" href="#" aria-expanded="false">Error</a>
                                        <ul aria-expanded="false">
                                            <li><Link href={route('template.show', { page: 'page-error-400' })}>Error 400</Link></li>
                                            <li><Link href={route('template.show', { page: 'page-error-403' })}>Error 403</Link></li>
                                            <li><Link href={route('template.show', { page: 'page-error-404' })}>Error 404</Link></li>
                                            <li><Link href={route('template.show', { page: 'page-error-500' })}>Error 500</Link></li>
                                            <li><Link href={route('template.show', { page: 'page-error-503' })}>Error 503</Link></li>
                                        </ul>
                                    </li>
                                    <li><Link href={route('template.show', { page: 'page-lock-screen' })}>Lock Screen</Link></li>
                                    <li><Link href={route('template.show', { page: 'empty-page' })}>Empty Page</Link></li>
                                </ul>
                            </li>
                        </ul>
                        <div className="side-bar-profile">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <div className="side-bar-profile-img">
                                    <img src="/images/user.jpg" alt="" />
                                </div>
                                <div className="profile-info1">
                                    <h5>{user.name}</h5>
                                    <span>{user.email}</span>
                                </div>
                                <div className="profile-button">
                                    <i className="fas fa-caret-downd scale5 text-light" />
                                </div>
                            </div>
                            <div className="d-flex justify-content-between mb-2 progress-info">
                                <span className="fs-12">
                                    <i className="fas fa-star text-orange me-2" />
                                    Task Progress
                                </span>
                                <span className="fs-12">20/45</span>
                            </div>
                            <div className="progress default-progress">
                                <div
                                    className="progress-bar bg-gradientf progress-animated"
                                    style={{ width: '45%', height: 8 }}
                                    role="progressbar"
                                />
                            </div>
                        </div>

                        <div className="copyright text-center">
                            <p className="mb-0">© 2026 — Where Insights Drive Action</p>
                            <p className="mb-0">v1.2603.1</p>
                        </div>
                    </div>
                </div>

                <div className="content-body default-height">
                    <div className="container-fluid">
                        {children}
                    </div>
                </div>

                <div className="footer">
                    <div className="copyright text-center">
                        <p className="mb-0">© 2026 — Where Insights Drive Action</p>
                        <p className="mb-0">v1.2603.1</p>
                    </div>
                </div>

                <div className="sidebar-right style-1">
                    <div className="bg-overlay" />
                    <a className="sidebar-right-trigger" href="#">
                        <span>
                            <i className="fas fa-cog" />
                        </span>
                    </a>
                    <a className="sidebar-close-trigger" href="#">
                        <i className="las la-times" />
                    </a>
                    <div className="sidebar-right-inner">
                        <h4>Settings</h4>
                        <div className="tab-content">
                            <div className="tab-pane fade active show">
                                <div className="admin-settings">
                                    <p className="mb-0">Gunakan toggle sun/moon untuk Light/Dark.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="note-text">Theme &amp; layout settings</div>
                </div>
            </div>
        </>
    );
}
