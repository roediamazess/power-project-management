import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

function Dashboard() {
    const chartsRef = useRef([]);

    useEffect(() => {
        const ApexCharts = window?.ApexCharts;
        const $ = window?.jQuery;

        const destroyAll = () => {
            for (const chart of chartsRef.current) {
                try {
                    chart?.destroy?.();
                } catch {
                }
            }
            chartsRef.current = [];
        };

        destroyAll();

        const createChart = (selector, options) => {
            if (!ApexCharts) return;
            const el = document.querySelector(selector);
            if (!el) return;
            const chart = new ApexCharts(el, options);
            chart.render();
            chartsRef.current.push(chart);
        };

        if ($?.fn?.peity) {
            $('span.donut1').peity('donut', { width: 60, height: 60 });
        }

        createChart('#chartBar', {
            series: [
                { name: 'Running', data: [50, 18, 70, 40, 90, 70, 20] },
                { name: 'Cycling', data: [80, 40, 55, 20, 45, 30, 80] },
            ],
            chart: { type: 'bar', height: 300, toolbar: { show: false } },
            plotOptions: {
                bar: { horizontal: false, columnWidth: '57%', endingShape: 'rounded', borderRadius: 8 },
            },
            colors: ['#FFA26D', '#FF5ED2'],
            dataLabels: { enabled: false },
            legend: { show: false },
            stroke: { show: true, width: 4, colors: ['transparent'] },
            grid: { borderColor: 'var(--border)' },
            xaxis: {
                categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                labels: { style: { colors: '#787878', fontSize: '13px', fontFamily: 'poppins', fontWeight: 100 } },
                axisTicks: { show: false },
                axisBorder: { show: false },
            },
            yaxis: { labels: { style: { colors: '#787878', fontSize: '13px', fontFamily: 'poppins' } } },
            fill: { opacity: 1 },
            tooltip: { y: { formatter: (val) => `${val}` } },
        });

        createChart('#revenueMap', {
            series: [{ name: 'Revenue', data: [31, 40, 28, 51, 42, 109, 100] }],
            chart: { height: 250, type: 'area', toolbar: { show: false } },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 2 },
            colors: ['#886CC0'],
            xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
            yaxis: { labels: { show: false } },
            grid: { show: false },
        });

        createChart('#columnChart', {
            series: [{ name: 'Clients', data: [10, 15, 12, 18, 14, 20, 16, 22] }],
            chart: { type: 'bar', height: 80, sparkline: { enabled: true } },
            plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
            colors: ['#26E023'],
            tooltip: { enabled: false },
        });

        createChart('#NewCustomers', {
            series: [{ name: 'Clients', data: [20, 25, 18, 22, 19, 28, 24, 30] }],
            chart: { type: 'area', height: 80, sparkline: { enabled: true } },
            stroke: { curve: 'smooth', width: 2 },
            colors: ['#FF86B1'],
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.6, opacityTo: 0.1 } },
            tooltip: { enabled: false },
        });

        createChart('#NewCustomers1', {
            series: [{ name: 'Projects', data: [10, 14, 12, 16, 15, 18, 17, 21] }],
            chart: { type: 'area', height: 80, sparkline: { enabled: true } },
            stroke: { curve: 'smooth', width: 2 },
            colors: ['#61CFF1'],
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.6, opacityTo: 0.1 } },
            tooltip: { enabled: false },
        });

        createChart('#redial', {
            series: [70],
            chart: { height: 200, type: 'radialBar' },
            plotOptions: {
                radialBar: {
                    hollow: { size: '55%' },
                    track: { background: 'rgba(136,108,192,0.15)' },
                    dataLabels: {
                        name: { show: false },
                        value: { fontSize: '24px', fontFamily: 'poppins', fontWeight: 700, color: '#000' },
                    },
                },
            },
            colors: ['#886CC0'],
            labels: ['Progress'],
        });

        createChart('#emailchart', {
            series: [27, 11, 22, 15, 25],
            chart: { type: 'donut', height: 200 },
            labels: ['Primary', 'Promotion', 'Forum', 'Socials', 'Spam'],
            colors: ['#886CC0', '#26E023', '#61CFF1', '#FFDA7C', '#FF86B1'],
            legend: { show: false },
            dataLabels: { enabled: false },
        });

        return () => destroyAll();
    }, []);

    return (
        <>
            <Head title="Power Project Management" />

            <div className="row">
                <div className="col-xl-12">
                    <div className="row">
                        <div className="col-xl-6">
                            <div className="row">
                                <div className="col-xl-12">
                                    <div className="card tryal-gradient">
                                        <div className="card-body tryal row">
                                            <div className="col-xl-7 col-sm-7">
                                                <h2 className="mb-0">Manage your project in one touch</h2>
                                                <span>
                                                    Let Power Project Management manage your project automatically with our best AI
                                                    systems
                                                </span>
                                                <div className="d-flex flex-wrap gap-2 mt-3">
                                                    <a href="#" className="btn btn-rounded btn-outline-light">
                                                        Try Free Now
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="col-xl-5 col-sm-5">
                                                <img src="/images/chart.png" alt="" className="sd-shape" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-12">
                                    <div className="card">
                                        <div className="card-header border-0 pb-0 flex-wrap">
                                            <h4 className="card-title">Project Statistics</h4>
                                            <div className="d-flex align-items-center mt-3 project-tab">
                                                <div className="card-tabs mt-sm-0 me-3">
                                                    <ul className="nav nav-tabs" role="tablist">
                                                        <li className="nav-item">
                                                            <a
                                                                className="nav-link active"
                                                                data-bs-toggle="tab"
                                                                href="#monthly"
                                                                role="tab"
                                                            >
                                                                Monthly
                                                            </a>
                                                        </li>
                                                        <li className="nav-item">
                                                            <a
                                                                className="nav-link"
                                                                data-bs-toggle="tab"
                                                                href="#weekly"
                                                                role="tab"
                                                            >
                                                                Weekly
                                                            </a>
                                                        </li>
                                                        <li className="nav-item">
                                                            <a
                                                                className="nav-link"
                                                                data-bs-toggle="tab"
                                                                href="#today"
                                                                role="tab"
                                                            >
                                                                Today
                                                            </a>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div className="dropdown ms-2">
                                                    <div className="btn-link" data-bs-toggle="dropdown">
                                                        <svg
                                                            width="20"
                                                            height="20"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <circle cx="12.4999" cy="3.5" r="2.5" fill="#A5A5A5" />
                                                            <circle cx="12.4999" cy="11.5" r="2.5" fill="#A5A5A5" />
                                                            <circle cx="12.4999" cy="19.5" r="2.5" fill="#A5A5A5" />
                                                        </svg>
                                                    </div>
                                                    <div className="dropdown-menu dropdown-menu-right">
                                                        <a className="dropdown-item" href="#">
                                                            Delete
                                                        </a>
                                                        <a className="dropdown-item" href="#">
                                                            Edit
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center flex-wrap">
                                                <div className="d-flex">
                                                    <div className="d-inline-block position-relative donut-chart-sale mb-3">
                                                        <span
                                                            className="donut1"
                                                            data-peity='{ "fill": ["rgba(136,108,192,1)", "rgba(241, 234, 255, 1)"],   "innerRadius": 20, "radius": 15}'
                                                        >
                                                            5/8
                                                        </span>
                                                    </div>
                                                    <div className="ms-3">
                                                        <h4 className="fs-24 mb-0">246</h4>
                                                        <p className="mb-0">Total Projects</p>
                                                    </div>
                                                </div>
                                                <div className="d-flex">
                                                    <div className="d-flex me-5">
                                                        <div className="mt-2">
                                                            <svg
                                                                width="13"
                                                                height="13"
                                                                viewBox="0 0 13 13"
                                                                fill="none"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <circle cx="6.5" cy="6.5" r="6.5" fill="#FFCF6D" />
                                                            </svg>
                                                        </div>
                                                        <div className="ms-3">
                                                            <h4 className="fs-24 mb-0">246</h4>
                                                            <p className="mb-0">On Going</p>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex">
                                                        <div className="mt-2">
                                                            <svg
                                                                width="13"
                                                                height="13"
                                                                viewBox="0 0 13 13"
                                                                fill="none"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <circle cx="6.5" cy="6.5" r="6.5" fill="#FFA7D7" />
                                                            </svg>
                                                        </div>
                                                        <div className="ms-3">
                                                            <h4 className="fs-24 mb-0">28</h4>
                                                            <p className="mb-0">Unfinished</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div id="chartBar" className="chartBar" />
                                            <div className="d-flex align-items-center">
                                                <label className="form-check-label form-label mb-0" htmlFor="flexSwitchCheckChecked1">
                                                    Number
                                                </label>
                                                <div className="form-check form-switch toggle-switch">
                                                    <input
                                                        className="form-check-input custome"
                                                        type="checkbox"
                                                        id="flexSwitchCheckChecked1"
                                                        defaultChecked
                                                    />
                                                </div>
                                                <label className="form-check-label form-label mb-0 ms-3" htmlFor="flexSwitchCheckChecked2">
                                                    Analytics
                                                </label>
                                                <div className="form-check form-switch toggle-switch">
                                                    <input
                                                        className="form-check-input custome"
                                                        type="checkbox"
                                                        id="flexSwitchCheckChecked2"
                                                        defaultChecked
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-12">
                                    <div className="card">
                                        <div className="card-header border-0 pb-0">
                                            <h4 className="card-title mb-0">Completion Project Rate</h4>
                                            <div className="dropdown">
                                                <div className="btn-link" data-bs-toggle="dropdown">
                                                    <svg
                                                        width="20"
                                                        height="20"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <circle cx="12.4999" cy="3.5" r="2.5" fill="#A5A5A5" />
                                                        <circle cx="12.4999" cy="11.5" r="2.5" fill="#A5A5A5" />
                                                        <circle cx="12.4999" cy="19.5" r="2.5" fill="#A5A5A5" />
                                                    </svg>
                                                </div>
                                                <div className="dropdown-menu dropdown-menu-right">
                                                    <a className="dropdown-item" href="#">
                                                        Delete
                                                    </a>
                                                    <a className="dropdown-item" href="#">
                                                        Edit
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-body pb-0">
                                            <div id="revenueMap" className="revenueMap" />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-12">
                                    <div className="card">
                                        <div className="card-header pb-0 border-0">
                                            <div>
                                                <h4 className="card-title">Recent Emails</h4>
                                                <p className="mb-0">Lorem ipsum dolor sit amet</p>
                                            </div>
                                            <div>
                                                <a href="#" className="btn btn-outline-primary btn-rounded">
                                                    View More
                                                </a>
                                            </div>
                                        </div>
                                        <div className="card-body px-0 pt-2">
                                            <div className="d-flex justify-content-between recent-emails">
                                                <div className="d-flex">
                                                    <div className="profile-k">
                                                        <span className="bg-success">K</span>
                                                    </div>
                                                    <div className="ms-3">
                                                        <a href="#">
                                                            <h4 className="fs-18 font-w500">
                                                                How to improve project management flows
                                                            </h4>
                                                        </a>
                                                        <p className="text-black mb-0">
                                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                                            <br />
                                                            eiusmod tempor incididunt ut labore et dolore magna aliqua...
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="email-check">
                                                    <label className="like-btn mb-0">
                                                        <input type="checkbox" />
                                                        <span className="checkmark" />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between recent-emails">
                                                <div className="d-flex">
                                                    <div className="profile-k">
                                                        <img src="/images/profile/small/pic6.jpg" alt="" />
                                                    </div>
                                                    <div className="ms-3">
                                                        <a href="#">
                                                            <h4 className="fs-18 font-w500">Power Project Management Final UseCase Diagram</h4>
                                                        </a>
                                                        <p className="text-black mb-0">
                                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                                            <br />
                                                            eiusmod tempor incididunt ut labore et dolore magna aliqua...
                                                        </p>
                                                        <div className="final-badge">
                                                            <span className="badge text-black border">
                                                                <i className="far fa-file-alt me-3" />
                                                                Master_file.fig
                                                            </span>
                                                            <span className="badge text-black border">
                                                                <i className="fas fa-image me-2" />
                                                                CoverPreview.jpg
                                                            </span>
                                                            <span className="badge border bgl-primary font-w700">4 files more</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="email-check">
                                                    <label className="like-btn mb-0">
                                                        <input type="checkbox" />
                                                        <span className="checkmark" />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between recent-emails">
                                                <div className="d-flex">
                                                    <div className="profile-k">
                                                        <span className="bg-warning">G</span>
                                                    </div>
                                                    <div className="ms-3">
                                                        <a href="#">
                                                            <h4 className="fs-18 font-w500">
                                                                Weekly Design Inspirations by Envato
                                                            </h4>
                                                        </a>
                                                        <p className="text-black mb-0">
                                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                                            <br />
                                                            eiusmod tempor incididunt ut labore et dolore magna aliqua...
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="email-check">
                                                    <label className="like-btn mb-0">
                                                        <input type="checkbox" />
                                                        <span className="checkmark" />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-xl-6">
                            <div className="row">
                                <div className="col-xl-12">
                                    <div className="row">
                                        <div className="col-xl-6 col-sm-6">
                                            <div className="card">
                                                <div className="card-body card-padding d-flex align-items-center justify-content-between">
                                                    <div>
                                                        <h4 className="mb-3 text-nowrap">Total Clients</h4>
                                                        <div className="d-flex align-items-center">
                                                            <h2 className="fs-32 font-w700 mb-0 counter">68</h2>
                                                            <div className="ms-4 d-flex align-items-center">
                                                                <svg
                                                                    width="16"
                                                                    height="11"
                                                                    viewBox="0 0 21 11"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <path
                                                                        d="M1.49217 11C0.590508 11 0.149368 9.9006 0.800944 9.27736L9.80878 0.66117C10.1954 0.29136 10.8046 0.291359 11.1912 0.661169L20.1991 9.27736C20.8506 9.9006 20.4095 11 19.5078 11H1.49217Z"
                                                                        fill="#09BD3C"
                                                                    />
                                                                </svg>
                                                                <strong className="text-success">+0,5%</strong>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div id="columnChart" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-xl-6 col-sm-6">
                                            <div className="card">
                                                <div className="card-body card-padding d-flex align-items-center justify-content-between">
                                                    <div className="w-75">
                                                        <h4 className="mb-3 text-nowrap">Total Clients</h4>
                                                        <div className="progress default-progress">
                                                            <div
                                                                className="progress-bar bg-gradient1 progress-animated"
                                                                style={{ width: '40%', height: 8 }}
                                                                role="progressbar"
                                                            />
                                                        </div>
                                                        <div className="mt-2">
                                                            <p className="mb-0">
                                                                <strong className="text-danger me-2">76</strong>left from
                                                                target
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h2 className="fs-32 font-w700 mb-0">42</h2>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-xl-6 col-sm-6">
                                            <div className="card">
                                                <div className="card-body d-flex px-4 justify-content-between">
                                                    <div>
                                                        <div>
                                                            <h2 className="fs-32 font-w700 counter">562</h2>
                                                            <h4 className="mb-0 text-nowrap">Total Clients</h4>
                                                            <p className="mb-0">
                                                                <strong className="text-danger">-2%</strong> than last month
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div id="NewCustomers" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-xl-6 col-sm-6">
                                            <div className="card">
                                                <div className="card-body d-flex px-4 justify-content-between">
                                                    <div>
                                                        <div>
                                                            <h2 className="fs-32 font-w700 counter">892</h2>
                                                            <h4 className="mb-0 text-nowrap">New Projects</h4>
                                                            <p className="mb-0">
                                                                <strong className="text-success">+2%</strong> than last month
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div id="NewCustomers1" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-xl-6 col-sm-6">
                                                    <div className="owl-carousel card-slider">
                                                        <div className="items">
                                                            <h4 className="card-title mb-4">
                                                                Power Project Management Company Profile Website Project
                                                            </h4>
                                                            <span className="fs-14 font-w400 text-black">
                                                                Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                                                                Id quibusdam eaque vero ullam odit nostrum nemo excepturi
                                                                explicabo ipsum voluptas nihil quae doloremque ducimus.
                                                            </span>
                                                        </div>
                                                        <div className="items">
                                                            <h4 className="fs-20 font-w700 mb-4">
                                                                Power Project Management Company Profile Website Project
                                                            </h4>
                                                            <span className="fs-14 font-w400 text-black">
                                                                Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                                                                Ab autem, quae debitis voluptatum omnis, quaerat deserunt
                                                                nam voluptates exercitationem facere sequi dolorem.
                                                            </span>
                                                        </div>
                                                        <div className="items">
                                                            <h4 className="fs-20 font-w700 mb-4">
                                                                Power Project Management Company Profile Website Project
                                                            </h4>
                                                            <span className="fs-14 font-w400 text-black">
                                                                Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                                                                Ab autem, quae debitis voluptatum omnis, quaerat deserunt
                                                                nam voluptates exercitationem facere sequi dolorem.
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-xl-6 redial col-sm-6 align-self-center">
                                                    <div id="redial" />
                                                    <span className="text-center d-block fs-18 font-w600">
                                                        On Progress <small className="text-success">70%</small>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-12 col-lg-12">
                                    <div className="row">
                                        <div className="col-xl-6 col-xxl-12 col-sm-6">
                                            <div className="card">
                                                <div className="card-header border-0 pb-0">
                                                    <div>
                                                        <h4 className="card-title">Email Categories</h4>
                                                        <p className="mb-0">Lorem ipsum dolor sit amet</p>
                                                    </div>
                                                </div>
                                                <div className="card-body pb-0">
                                                    <div id="emailchart" />
                                                    <div className="mb-3 mt-4">
                                                        <h4>Legend</h4>
                                                    </div>
                                                    <div className="email-lagend">
                                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                                            <span className="fs-16 text-gray">
                                                                <svg
                                                                    className="me-2"
                                                                    width="20"
                                                                    height="20"
                                                                    viewBox="0 0 20 20"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <rect width="20" height="20" rx="6" fill="#886CC0" />
                                                                </svg>
                                                                Primary (27%)
                                                            </span>
                                                            <h5 className="mb-0 font-w600">763</h5>
                                                        </div>
                                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                                            <span className="fs-16 text-gray">
                                                                <svg
                                                                    className="me-2"
                                                                    width="20"
                                                                    height="20"
                                                                    viewBox="0 0 20 20"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <rect width="20" height="20" rx="6" fill="#26E023" />
                                                                </svg>
                                                                Promotion (11%)
                                                            </span>
                                                            <h5 className="mb-0 font-w600">321</h5>
                                                        </div>
                                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                                            <span className="fs-16 text-gray">
                                                                <svg
                                                                    className="me-2"
                                                                    width="20"
                                                                    height="20"
                                                                    viewBox="0 0 20 20"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <rect width="20" height="20" rx="6" fill="#61CFF1" />
                                                                </svg>
                                                                Forum (22%)
                                                            </span>
                                                            <h5 className="mb-0 font-w600">69</h5>
                                                        </div>
                                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                                            <span className="fs-16 text-gray">
                                                                <svg
                                                                    className="me-2"
                                                                    width="20"
                                                                    height="20"
                                                                    viewBox="0 0 20 20"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <rect width="20" height="20" rx="6" fill="#FFDA7C" />
                                                                </svg>
                                                                Socials (15%)
                                                            </span>
                                                            <h5 className="mb-0 font-w600">154</h5>
                                                        </div>
                                                        <div className="d-flex align-items-center justify-content-between mb-0 spam">
                                                            <span className="fs-16 text-gray">
                                                                <svg
                                                                    className="me-2"
                                                                    width="20"
                                                                    height="20"
                                                                    viewBox="0 0 20 20"
                                                                    fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                >
                                                                    <rect width="20" height="20" rx="6" fill="#FF86B1" />
                                                                </svg>
                                                                Spam (25%)
                                                            </span>
                                                            <h5 className="mb-0 font-w600">696</h5>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="card-footer border-0 pt-0">
                                                    <a href="#" className="btn btn-outline-primary btn-rounded d-block">
                                                        Update Progress
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-xl-6 col-xxl-12 col-sm-6">
                                            <div className="card">
                                                <div className="card-header border-0 pb-0">
                                                    <div>
                                                        <h4 className="card-title">Important Projects</h4>
                                                        <p className="mb-0">Lorem ipsum dolor sit amet</p>
                                                    </div>
                                                </div>
                                                <div className="card-body pb-0 pt-3">
                                                    <div className="project-details">
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <div className="d-flex align-items-center">
                                                                <div className="big-wind">
                                                                    <img src="/images/big-wind.png" alt="" />
                                                                </div>
                                                                <div className="ms-3">
                                                                    <h5 className="mb-1">Big Wind</h5>
                                                                    <p className="mb-0">Creative Agency</p>
                                                                </div>
                                                            </div>
                                                            <div className="dropdown">
                                                                <div className="btn-link" data-bs-toggle="dropdown">
                                                                    <svg
                                                                        width="20"
                                                                        height="20"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <circle cx="12.4999" cy="3.5" r="2.5" fill="#A5A5A5" />
                                                                        <circle cx="12.4999" cy="11.5" r="2.5" fill="#A5A5A5" />
                                                                        <circle cx="12.4999" cy="19.5" r="2.5" fill="#A5A5A5" />
                                                                    </svg>
                                                                </div>
                                                                <div className="dropdown-menu dropdown-menu-right">
                                                                    <a className="dropdown-item" href="#">Delete</a>
                                                                    <a className="dropdown-item" href="#">Edit</a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <h5 className="mt-3">
                                                            Optimization Dashboard Page for indexing in Google
                                                        </h5>
                                                        <div className="projects">
                                                            <span className="badge badge-warning light me-3">SEO</span>
                                                            <span className="badge badge-danger light">MARKETING</span>
                                                        </div>
                                                        <div className="mt-3">
                                                            <div className="progress default-progress">
                                                                <div
                                                                    className="progress-bar bg-gradient1 progress-animated"
                                                                    style={{ width: '45%', height: 5 }}
                                                                    role="progressbar"
                                                                />
                                                            </div>
                                                            <div className="d-flex align-items-end mt-3 justify-content-between">
                                                                <p className="mb-0">
                                                                    <strong className="text-black me-2">12</strong>Task Done
                                                                </p>
                                                                <p className="mb-0">Due date: 12/05/2020</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <hr />
                                                </div>
                                                <div className="card-footer pt-0 border-0">
                                                    <a href="#" className="btn btn-outline-primary btn-rounded d-block">
                                                        Pin other projects
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-12 col-lg-12">
                                    <div className="card">
                                        <div className="card-header pb-0 border-0">
                                            <div>
                                                <h4 className="card-title">Messages</h4>
                                                <p className="mb-0">Lorem ipsum dolor sit amet</p>
                                            </div>
                                            <div>
                                                <a
                                                    href="#"
                                                    className="btn btn-primary btn-rounded"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#sendMessageModal"
                                                >
                                                    + New Messages
                                                </a>
                                            </div>
                                        </div>
                                        <div className="card-body px-0 pt-0">
                                            <div className="msg-bx d-flex justify-content-between align-items-center">
                                                <div className="msg d-flex align-items-center w-100">
                                                    <div className="image-box active">
                                                        <img src="/images/profile/small/pic6.jpg" alt="" />
                                                    </div>
                                                    <div className="ms-3 w-100">
                                                        <a href="#">
                                                            <h5 className="mb-1">Maren Rosser</h5>
                                                        </a>
                                                        <div className="d-flex justify-content-between">
                                                            <p className="me-auto mb-0 text-black">
                                                                Hei, dont forget to clear server cache!
                                                            </p>
                                                            <small className="me-4">25min ago</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="dropdown">
                                                    <div className="btn-link" data-bs-toggle="dropdown">
                                                        <svg
                                                            width="20"
                                                            height="20"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <circle cx="12.4999" cy="3.5" r="2.5" fill="#A5A5A5" />
                                                            <circle cx="12.4999" cy="11.5" r="2.5" fill="#A5A5A5" />
                                                            <circle cx="12.4999" cy="19.5" r="2.5" fill="#A5A5A5" />
                                                        </svg>
                                                    </div>
                                                    <div className="dropdown-menu dropdown-menu-right">
                                                        <a className="dropdown-item" href="#">
                                                            Delete
                                                        </a>
                                                        <a className="dropdown-item" href="#">
                                                            Edit
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="sendMessageModal">
                <div className="modal-dialog modal-dialog-centered" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Send Message</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" />
                        </div>
                        <div className="modal-body">
                            <form className="comment-form">
                                <div className="row">
                                    <div className="col-lg-6">
                                        <div className="mb-3">
                                            <label className="text-black font-w600 form-label required">Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                defaultValue="Author"
                                                name="Author"
                                                placeholder="Author"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-lg-6">
                                        <div className="mb-3">
                                            <label className="text-black font-w600 form-label">Email</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                defaultValue="Email"
                                                placeholder="Email"
                                                name="Email"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="mb-3">
                                            <label className="text-black font-w600 form-label">Comment</label>
                                            <textarea
                                                rows={8}
                                                className="form-control"
                                                name="comment"
                                                placeholder="Comment"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="mb-3 mb-0">
                                            <input type="submit" value="Post Comment" className="submit btn btn-primary" name="submit" />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page) => <AuthenticatedLayout header="Dashboard">{page}</AuthenticatedLayout>;

export default Dashboard;
