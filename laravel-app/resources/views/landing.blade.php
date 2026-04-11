<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Power Project Management | See what matters.</title>

    <link rel="icon" type="image/png" href="/favicon.png?v=20260326">
    <link rel="shortcut icon" type="image/png" href="/favicon.png?v=20260326">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet">

    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Roboto', 'sans-serif'],
                    },
                    colors: {
                        brand: {
                            purple: '#8b5cf6',
                            pink: '#ec4899',
                            orange: '#f97316',
                            light: '#f8f9fa',
                            sidebar: '#f4f0f8'
                        }
                    },
                    animation: {
                        'blob': 'blob 7s infinite',
                        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                        'bar-grow': 'growUp 1.5s ease-out forwards',
                    },
                    keyframes: {
                        blob: {
                            '0%': { transform: 'translate(0px, 0px) scale(1)' },
                            '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                            '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                            '100%': { transform: 'translate(0px, 0px) scale(1)' },
                        },
                        fadeInUp: {
                            '0%': { opacity: '0', transform: 'translateY(20px)' },
                            '100%': { opacity: '1', transform: 'translateY(0)' },
                        },
                        growUp: {
                            '0%': { transform: 'scaleY(0)' },
                            '100%': { transform: 'scaleY(1)' },
                        }
                    }
                }
            }
        }
    </script>

    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        body {
            background-color: #f8f9fa;
            color: #1e293b;
            overflow-x: hidden;
        }
        .glass-nav {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        .glass-card {
            background: #ffffff;
            border: 1px solid rgba(0, 0, 0, 0.05);
            box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
        }
        .text-gradient {
            background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .glow-button {
            transition: all 0.3s ease;
        }
        .glow-button:hover {
            box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.4);
            transform: translateY(-2px);
        }
        .bar-origin-bottom {
            transform-origin: bottom;
        }
        .donut-chart {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: conic-gradient(#8b5cf6 85%, #e2e8f0 85%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .donut-inner {
            width: 32px;
            height: 32px;
            background-color: white;
            border-radius: 50%;
        }
        .grid-line {
            position: relative;
        }
        .grid-line::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 20px;
            right: 0;
            height: 1px;
            background-color: #f1f5f9;
            z-index: 0;
        }
    </style>
</head>
<body class="antialiased selection:bg-brand-purple selection:text-white">
    <div class="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-purple/10 blur-[100px] animate-blob"></div>
        <div class="absolute top-[20%] right-[-10%] w-[30%] h-[40%] rounded-full bg-brand-pink/10 blur-[100px] animate-blob" style="animation-delay: 2s;"></div>
        <div class="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-brand-orange/10 blur-[100px] animate-blob" style="animation-delay: 4s;"></div>
    </div>

    <nav class="fixed w-full z-50 glass-nav transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-20">
                <div class="flex items-center gap-3 cursor-pointer">
                    <img src="/images/power-pro-logo-plain.png?v=20260326" alt="Power Pro Logo" class="w-10 h-10 flex-shrink-0">
                </div>
                <div class="hidden md:flex space-x-8">
                    <a href="#features" class="text-sm font-semibold text-slate-600 hover:text-brand-purple transition-colors">Features</a>
                    <a href="#solutions" class="text-sm font-semibold text-slate-600 hover:text-brand-purple transition-colors">Workspaces</a>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/login">Access Dashboard</a>
                </div>
            </div>
        </div>
    </nav>

    <section class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-sm text-brand-purple mb-8 animate-fade-in-up font-medium shadow-sm" style="animation-delay: 0.1s;">
                <span class="flex h-2 w-2 rounded-full bg-brand-purple animate-pulse"></span>
                Internal System v2.0 is now live
            </div>

            <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in-up text-slate-900" style="animation-delay: 0.2s;">
                See what matters. <br/>
                Decide with confidence. <br/>
                <span class="text-gradient">Act with impact.</span>
            </h1>

            <p class="mt-6 text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style="animation-delay: 0.3s;">
                The unified command center for our team. Align your work, monitor project performance in real-time, and achieve company targets together.
            </p>

            <div class="mt-20 relative mx-auto max-w-4xl animate-fade-in-up text-left" style="animation-delay: 0.6s;">
                <div class="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
                    <div class="flex h-[450px]">
                        <div class="hidden md:flex flex-col w-56 bg-brand-sidebar border-r border-slate-200 py-6">
                            <div class="px-6 space-y-4">
                                <div class="flex items-center gap-3 text-slate-500 hover:text-slate-800"><i data-lucide="handshake" class="w-5 h-5"></i><span class="font-medium text-sm">Partners</span></div>
                                <div class="flex items-center gap-3 text-slate-500 hover:text-slate-800"><i data-lucide="folder-kanban" class="w-5 h-5"></i><span class="font-medium text-sm">Projects</span></div>
                                <div class="flex items-center gap-3 text-slate-500 hover:text-slate-800"><i data-lucide="timer" class="w-5 h-5"></i><span class="font-medium text-sm">Time Boxing</span></div>
                                <div class="flex items-center gap-3 text-slate-500 hover:text-slate-800"><i data-lucide="clipboard-list" class="w-5 h-5"></i><span class="font-medium text-sm">Audit Logs</span></div>
                            </div>
                        </div>

                        <div class="flex-1 p-6 md:p-8 bg-white flex flex-col">
                            <div class="flex justify-between items-center mb-8">
                                <h3 class="text-xl font-bold text-slate-800">Project Statistics</h3>
                                <div class="flex items-center gap-2">
                                    <div class="flex bg-slate-100 rounded-lg p-1">
                                        <button class="px-4 py-1.5 bg-brand-purple text-white text-xs font-semibold rounded-md shadow-sm">Monthly</button>
                                        <button class="px-4 py-1.5 text-slate-500 text-xs font-medium hover:text-slate-700">Weekly</button>
                                        <button class="px-4 py-1.5 text-slate-500 text-xs font-medium hover:text-slate-700">Today</button>
                                    </div>
                                    <button class="text-slate-400 hover:text-slate-600"><i data-lucide="more-vertical" class="w-5 h-5"></i></button>
                                </div>
                            </div>

                            <div class="flex justify-between items-center mb-8">
                                <div class="flex items-center gap-4">
                                    <div class="donut-chart">
                                        <div class="donut-inner"></div>
                                    </div>
                                    <div>
                                        <div class="text-2xl font-bold text-slate-800 leading-none">246</div>
                                        <div class="text-sm text-slate-400 mt-1">Total Projects</div>
                                    </div>
                                </div>
                                <div class="flex gap-8">
                                    <div class="text-center">
                                        <div class="flex items-center justify-center gap-2">
                                            <div class="w-2.5 h-2.5 rounded-full bg-brand-orange"></div>
                                            <span class="text-xl font-bold text-slate-800 leading-none">246</span>
                                        </div>
                                        <div class="text-xs text-slate-400 mt-1">On Going</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="flex items-center justify-center gap-2">
                                            <div class="w-2.5 h-2.5 rounded-full bg-brand-pink"></div>
                                            <span class="text-xl font-bold text-slate-800 leading-none">28</span>
                                        </div>
                                        <div class="text-xs text-slate-400 mt-1">Unfinished</div>
                                    </div>
                                </div>
                            </div>

                            <div class="flex-1 relative flex flex-col justify-between pt-4">
                                <div class="absolute inset-0 flex flex-col justify-between z-0 pointer-events-none">
                                    <div class="grid-line flex items-center h-0"><span class="text-[10px] text-slate-400 w-6 text-right">100</span></div>
                                    <div class="grid-line flex items-center h-0"><span class="text-[10px] text-slate-400 w-6 text-right">80</span></div>
                                    <div class="grid-line flex items-center h-0"><span class="text-[10px] text-slate-400 w-6 text-right">60</span></div>
                                    <div class="grid-line flex items-center h-0"><span class="text-[10px] text-slate-400 w-6 text-right">40</span></div>
                                    <div class="grid-line flex items-center h-0"><span class="text-[10px] text-slate-400 w-6 text-right">20</span></div>
                                    <div class="grid-line flex items-center h-0"><span class="text-[10px] text-slate-400 w-6 text-right">0</span></div>
                                </div>

                                <div class="absolute bottom-0 left-8 right-0 h-full flex justify-between items-end pb-0 px-2 z-10">
                                    <div class="flex items-end gap-1.5 h-full pb-4">
                                        <div class="w-4 bg-brand-orange rounded-t-sm h-[50%] bar-origin-bottom animate-bar-grow"></div>
                                        <div class="w-4 bg-brand-pink rounded-t-sm h-[80%] bar-origin-bottom animate-bar-grow" style="animation-delay: 0.1s;"></div>
                                    </div>
                                    <div class="flex items-end gap-1.5 h-full pb-4">
                                        <div class="w-4 bg-brand-orange rounded-t-sm h-[18%] bar-origin-bottom animate-bar-grow" style="animation-delay: 0.1s;"></div>
                                        <div class="w-4 bg-brand-pink rounded-t-sm h-[40%] bar-origin-bottom animate-bar-grow" style="animation-delay: 0.2s;"></div>
                                    </div>
                                    <div class="flex items-end gap-1.5 h-full pb-4">
                                        <div class="w-4 bg-brand-orange rounded-t-sm h-[70%] bar-origin-bottom animate-bar-grow" style="animation-delay: 0.2s;"></div>
                                        <div class="w-4 bg-brand-pink rounded-t-sm h-[55%] bar-origin-bottom animate-bar-grow" style="animation-delay: 0.3s;"></div>
                                    </div>
                                    <div class="flex items-end gap-1.5 h-full pb-4">
                                        <div class="w-4 bg-brand-orange rounded-t-sm h-[40%] bar-origin-bottom animate-bar-grow" style="animation-delay: 0.3s;"></div>
                                        <div class="w-4 bg-brand-pink rounded-t-sm h-[20%] bar-origin-bottom animate-bar-grow" style="animation-delay: 0.4s;"></div>
                                    </div>
                                    <div class="flex items-end gap-1.5 h-full pb-4">
                                        <div class="w-4 bg-brand-orange rounded-t-sm h-[90%] bar-origin-bottom animate-bar-grow" style="animation-delay: 0.4s;"></div>
                                        <div class="w-4 bg-brand-pink rounded-t-sm h-[45%] bar-origin-bottom animate-bar-grow" style="animation-delay: 0.5s;"></div>
                                    </div>
                                    <div class="flex items-end gap-1.5 h-full pb-4">
                                        <div class="w-4 bg-brand-orange rounded-t-sm h-[70%] bar-origin-bottom animate-bar-grow" style="animation-delay: 0.5s;"></div>
                                        <div class="w-4 bg-brand-pink rounded-t-sm h-[30%] bar-origin-bottom animate-bar-grow" style="animation-delay: 0.6s;"></div>
                                    </div>
                                    <div class="flex items-end gap-1.5 h-full pb-4">
                                        <div class="w-4 bg-brand-orange rounded-t-sm h-[20%] bar-origin-bottom animate-bar-grow" style="animation-delay: 0.6s;"></div>
                                        <div class="w-4 bg-brand-pink rounded-t-sm h-[80%] bar-origin-bottom animate-bar-grow" style="animation-delay: 0.7s;"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex justify-between pl-8 pr-2 mt-2 z-10">
                                <div class="text-[10px] text-slate-400 font-medium">Sun</div>
                                <div class="text-[10px] text-slate-400 font-medium">Mon</div>
                                <div class="text-[10px] text-slate-400 font-medium">Tue</div>
                                <div class="text-[10px] text-slate-400 font-medium">Wed</div>
                                <div class="text-[10px] text-slate-400 font-medium">Thu</div>
                                <div class="text-[10px] text-slate-400 font-medium">Fri</div>
                                <div class="text-[10px] text-slate-400 font-medium">Sat</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="border-y border-slate-200 bg-white py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p class="text-sm font-semibold text-slate-400 mb-6">INTEGRATED WITH COMPANY SYSTEMS</p>
            <div class="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-60 hover:opacity-100 transition-all duration-500 text-slate-700">
                <div class="flex items-center gap-2 font-bold text-xl"><i data-lucide="message-square" class="w-6 h-6 text-brand-purple"></i> Communication</div>
                <div class="flex items-center gap-2 font-bold text-xl"><i data-lucide="database" class="w-6 h-6 text-brand-pink"></i> Database</div>
                <div class="flex items-center gap-2 font-bold text-xl"><i data-lucide="file-text" class="w-6 h-6 text-brand-orange"></i> Documents</div>
                <div class="flex items-center gap-2 font-bold text-xl"><i data-lucide="calendar" class="w-6 h-6 text-blue-500"></i> Schedule Arrangement</div>
            </div>
        </div>
    </section>

    <section id="features" class="py-24 relative z-10 bg-slate-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16">
                <h2 class="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Powerful features for the entire team.</h2>
                <p class="text-slate-500 text-lg">Built-in tools designed to turn operational data into clarity, streamline daily workflows, and ensure every department moves in the same direction.</p>
            </div>

            <div class="grid md:grid-cols-3 gap-8">
                <div class="glass-card p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300 group">
                    <div class="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
                        <i data-lucide="eye" class="w-7 h-7 text-brand-purple"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-slate-800">See what matters.</h3>
                    <p class="text-slate-500 leading-relaxed mb-6">
                        Get full visibility into project status, team resource allocation, and potential operational bottlenecks in real-time.
                    </p>
                    <ul class="space-y-2 text-sm text-slate-600 font-medium">
                        <li class="flex items-center gap-2"><i data-lucide="check-circle-2" class="w-4 h-4 text-brand-purple"></i> Management Reports</li>
                        <li class="flex items-center gap-2"><i data-lucide="check-circle-2" class="w-4 h-4 text-brand-purple"></i> Active Project Monitoring</li>
                    </ul>
                </div>

                <div class="glass-card p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300 group relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full -z-10"></div>
                    <div class="w-14 h-14 rounded-xl bg-pink-100 flex items-center justify-center mb-6 group-hover:bg-pink-200 transition-colors">
                        <i data-lucide="brain-circuit" class="w-7 h-7 text-brand-pink"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-slate-800">Decide with confidence.</h3>
                    <p class="text-slate-500 leading-relaxed mb-6">
                        Make strategic decisions based on actual data. Minimize delay risks.
                    </p>
                    <ul class="space-y-2 text-sm text-slate-600 font-medium">
                        <li class="flex items-center gap-2"><i data-lucide="check-circle-2" class="w-4 h-4 text-brand-pink"></i> Internal Data Analysis</li>
                        <li class="flex items-center gap-2"><i data-lucide="check-circle-2" class="w-4 h-4 text-brand-pink"></i> Risk Evaluation</li>
                    </ul>
                </div>

                <div class="glass-card p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300 group">
                    <div class="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
                        <i data-lucide="zap" class="w-7 h-7 text-brand-orange"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-slate-800">Act with impact.</h3>
                    <p class="text-slate-500 leading-relaxed mb-6">
                        Execute plans with precision. Align coordination across divisions and ensure every task supports company KPIs.
                    </p>
                    <ul class="space-y-2 text-sm text-slate-600 font-medium">
                        <li class="flex items-center gap-2"><i data-lucide="check-circle-2" class="w-4 h-4 text-brand-orange"></i> Standardized Workflows</li>
                        <li class="flex items-center gap-2"><i data-lucide="check-circle-2" class="w-4 h-4 text-brand-orange"></i> Cross-Divisional Collaboration</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <section id="solutions" class="py-24 relative z-10 bg-white border-y border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div class="max-w-2xl">
                    <h2 class="text-3xl md:text-4xl font-bold mb-4 text-slate-900">Tailored for every workspace.</h2>
                    <p class="text-slate-500 text-lg">This system accommodates the specific needs of each workspace to ensure smooth company operations.</p>
                </div>
            </div>

            <div class="grid md:grid-cols-3 gap-6">
                <div class="glass-card rounded-2xl overflow-hidden group">
                    <div class="h-2 bg-brand-purple w-0 group-hover:w-full transition-all duration-500"></div>
                    <div class="p-8">
                        <div class="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-6 group-hover:bg-brand-purple transition-colors">
                            <i data-lucide="briefcase" class="w-5 h-5 text-brand-purple group-hover:text-white transition-colors"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-3 text-slate-800">Board of Directors</h3>
                        <p class="text-sm text-slate-500 mb-6">
                            Monitor high-level company performance, track strategic KPIs, and ensure long-term goals align with daily operations.
                        </p>
                    </div>
                </div>

                <div class="glass-card rounded-2xl overflow-hidden group">
                    <div class="h-2 bg-brand-pink w-0 group-hover:w-full transition-all duration-500"></div>
                    <div class="p-8">
                        <div class="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center mb-6 group-hover:bg-brand-pink transition-colors">
                            <i data-lucide="life-buoy" class="w-5 h-5 text-brand-pink group-hover:text-white transition-colors"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-3 text-slate-800">Technical Support</h3>
                        <p class="text-sm text-slate-500 mb-6">
                            Track IT tickets efficiently, manage user requests, and maintain system reliability with real-time issue monitoring.
                        </p>
                    </div>
                </div>

                <div class="glass-card rounded-2xl overflow-hidden group">
                    <div class="h-2 bg-brand-orange w-0 group-hover:w-full transition-all duration-500"></div>
                    <div class="p-8">
                        <div class="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-6 group-hover:bg-brand-orange transition-colors">
                            <i data-lucide="clipboard-list" class="w-5 h-5 text-brand-orange group-hover:text-white transition-colors"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-3 text-slate-800">Admin Officers</h3>
                        <p class="text-sm text-slate-500 mb-6">
                            Streamline daily office operations, manage resource allocations, and handle internal documentation seamlessly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="cta" class="py-20 relative overflow-hidden bg-slate-50">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="bg-gradient-to-br from-brand-purple to-brand-pink border border-purple-200 rounded-3xl p-10 md:p-16 text-center shadow-xl relative overflow-hidden">
                <div class="absolute inset-0 bg-white/10"></div>
                <h2 class="text-3xl md:text-5xl font-bold mb-6 text-white relative z-10">Ready to get to work?</h2>
                <p class="text-lg text-white/90 mb-10 max-w-2xl mx-auto relative z-10 font-medium">
                    Access the internal portal now to view your tasks, update project statuses, and collaborate with the team.
                </p>
                <div class="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                    <a href="/login" class="px-8 py-4 rounded-lg bg-white text-brand-purple font-bold glow-button">
                        Access Your Dashboard
                    </a>
                </div>
            </div>
        </div>
    </section>

    <footer class="border-t border-slate-200 bg-white pt-16 pb-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-2 md:grid-cols-3 gap-8 mb-12">
                <div class="col-span-2 md:col-span-1">
                    <div class="flex items-center gap-3 mb-4">
                        <img src="/images/power-pro-logo-plain.png?v=20260326" alt="Power Pro Logo" class="w-8 h-8 flex-shrink-0">
                    </div>
                    <p class="text-slate-500 text-sm">
                        The unified operational management system for internal work effectiveness.
                    </p>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-slate-800">Internal System</h4>
                    <ul class="space-y-3 text-sm text-slate-500">
                        <li><a href="/login" class="hover:text-brand-purple font-medium transition-colors">Main Dashboard</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-slate-800">Help & Guides</h4>
                    <ul class="space-y-3 text-sm text-slate-500">
                        <li><a href="/login" class="hover:text-brand-purple font-medium transition-colors">Access Portal</a></li>
                    </ul>
                </div>
            </div>

            <div class="border-t border-slate-100 pt-8 flex flex-col items-center gap-4">
                <p class="text-slate-500 text-sm text-center font-medium">
                    © 2026 — Where Insights Drive Action<br>
                    <span class="text-slate-400 text-xs mt-1 block">v1.2603.5</span>
                </p>
            </div>
        </div>
    </footer>

    <script>
        lucide.createIcons();
    </script>
</body>
</html>
