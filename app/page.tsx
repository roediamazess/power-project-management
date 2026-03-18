export default function Home() {
  return (
    <div suppressHydrationWarning>

    
    <div id="preloader">
		<div className="lds-ripple">
			<div></div>
			<div></div>
		</div>
    </div>
    

    
    <div id="main-wrapper">

        
		<div className="nav-header">
            <a href="index.html" className="brand-logo">
				<svg className="logo-abbr" width="55" height="55" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            </a>
            <div className="nav-control">
                <div className="hamburger">
                    <span className="line"></span><span className="line"></span><span className="line"></span>
                </div>
            </div>
        </div>
        
		
		
		<div className="chatbox">
			<div className="chatbox-close"></div>
			<div className="custom-tab-1">
				<ul className="nav nav-tabs">
					<li className="nav-item">
						<a className="nav-link" data-bs-toggle="tab" href="#notes">Notes</a>
					</li>
					<li className="nav-item">
						<a className="nav-link" data-bs-toggle="tab" href="#alerts">Alerts</a>
					</li>
					<li className="nav-item">
						<a className="nav-link active" data-bs-toggle="tab" href="#chat">Chat</a>
					</li>
				</ul>
				<div className="tab-content">
					<div className="tab-pane fade active show" id="chat" role="tabpanel">
						<div className="card mb-sm-3 mb-md-0 contacts_card dlab-chat-user-box">
							<div className="card-header chat-list-header text-center">
								<a href="#"><svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="18px" height="18px" viewBox="0 0 24 24" version="1.1"><g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"><rect fill="#000000" x="4" y="11" width="16" height="2" rx="1"/><rect fill="#000000" opacity="0.3" transform="translate(12.000000, 12.000000) rotate(-270.000000) translate(-12.000000, -12.000000) " x="4" y="11" width="16" height="2" rx="1"/></g></svg></a>
								<div>
									<h6 className="mb-1">Chat List</h6>
									<p className="mb-0">Show All</p>
								</div>
								<a href="#"><svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="18px" height="18px" viewBox="0 0 24 24" version="1.1"><g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"><rect x="0" y="0" width="24" height="24"/><circle fill="#000000" cx="5" cy="12" r="2"/><circle fill="#000000" cx="12" cy="12" r="2"/><circle fill="#000000" cx="19" cy="12" r="2"/></g></svg></a>
							</div>
							<div className="card-body contacts_body p-0 dlab-scroll  " id="DLAB_W_Contacts_Body">
								<ul className="contacts">
									<li className="name-first-letter">A</li>
									<li className="active dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/1.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon"></span>
											</div>
											<div className="user_info">
												<span>Archie Parker</span>
												<p>Kalid is online</p>
											</div>
										</div>
									</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/2.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon offline"></span>
											</div>
											<div className="user_info">
												<span>Alfie Mason</span>
												<p>Taherah left 7 mins ago</p>
											</div>
										</div>
									</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/3.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon"></span>
											</div>
											<div className="user_info">
												<span>AharlieKane</span>
												<p>Sami is online</p>
											</div>
										</div>
									</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/4.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon offline"></span>
											</div>
											<div className="user_info">
												<span>Athan Jacoby</span>
												<p>Nargis left 30 mins ago</p>
											</div>
										</div>
									</li>
									<li className="name-first-letter">B</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/5.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon offline"></span>
											</div>
											<div className="user_info">
												<span>Bashid Samim</span>
												<p>Rashid left 50 mins ago</p>
											</div>
										</div>
									</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/1.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon"></span>
											</div>
											<div className="user_info">
												<span>Breddie Ronan</span>
												<p>Kalid is online</p>
											</div>
										</div>
									</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/2.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon offline"></span>
											</div>
											<div className="user_info">
												<span>Ceorge Carson</span>
												<p>Taherah left 7 mins ago</p>
											</div>
										</div>
									</li>
									<li className="name-first-letter">D</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/3.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon"></span>
											</div>
											<div className="user_info">
												<span>Darry Parker</span>
												<p>Sami is online</p>
											</div>
										</div>
									</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/4.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon offline"></span>
											</div>
											<div className="user_info">
												<span>Denry Hunter</span>
												<p>Nargis left 30 mins ago</p>
											</div>
										</div>
									</li>
									<li className="name-first-letter">J</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/5.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon offline"></span>
											</div>
											<div className="user_info">
												<span>Jack Ronan</span>
												<p>Rashid left 50 mins ago</p>
											</div>
										</div>
									</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/1.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon"></span>
											</div>
											<div className="user_info">
												<span>Jacob Tucker</span>
												<p>Kalid is online</p>
											</div>
										</div>
									</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/2.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon offline"></span>
											</div>
											<div className="user_info">
												<span>James Logan</span>
												<p>Taherah left 7 mins ago</p>
											</div>
										</div>
									</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/3.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon"></span>
											</div>
											<div className="user_info">
												<span>Joshua Weston</span>
												<p>Sami is online</p>
											</div>
										</div>
									</li>
									<li className="name-first-letter">O</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/4.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon offline"></span>
											</div>
											<div className="user_info">
												<span>Oliver Acker</span>
												<p>Nargis left 30 mins ago</p>
											</div>
										</div>
									</li>
									<li className="dlab-chat-user">
										<div className="d-flex bd-highlight">
											<div className="img_cont">
												<img src="/images/avatar/5.jpg" className="rounded-circle user_img" alt="" />
												<span className="online_icon offline"></span>
											</div>
											<div className="user_info">
												<span>Oscar Weston</span>
												<p>Rashid left 50 mins ago</p>
											</div>
										</div>
									</li>
								</ul>
							</div>
						</div>
						<div className="card chat dlab-chat-history-box d-none">
							<div className="card-header chat-list-header text-center">
								<a href="#" className="dlab-chat-history-back">
									<svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="18px" height="18px" viewBox="0 0 24 24" version="1.1"><g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"><polygon points="0 0 24 0 24 24 0 24"/><rect fill="#000000" opacity="0.3" transform="translate(15.000000, 12.000000) scale(-1, 1) rotate(-90.000000) translate(-15.000000, -12.000000) " x="14" y="7" width="2" height="10" rx="1"/><path d="M3.7071045,15.7071045 C3.3165802,16.0976288 2.68341522,16.0976288 2.29289093,15.7071045 C1.90236664,15.3165802 1.90236664,14.6834152 2.29289093,14.2928909 L8.29289093,8.29289093 C8.67146987,7.914312 9.28105631,7.90106637 9.67572234,8.26284357 L15.6757223,13.7628436 C16.0828413,14.136036 16.1103443,14.7686034 15.7371519,15.1757223 C15.3639594,15.5828413 14.7313921,15.6103443 14.3242731,15.2371519 L9.03007346,10.3841355 L3.7071045,15.7071045 Z" fill="#000000" fillRule="nonzero" transform="translate(9.000001, 11.999997) scale(-1, -1) rotate(90.000000) translate(-9.000001, -11.999997) "/></g></svg>
								</a>
								<div>
									<h6 className="mb-1">Chat with Khelesh</h6>
									<p className="mb-0 text-success">Online</p>
								</div>							
								<div className="dropdown">
									<a href="#" data-bs-toggle="dropdown" aria-expanded="false"><svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="18px" height="18px" viewBox="0 0 24 24" version="1.1"><g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"><rect x="0" y="0" width="24" height="24"/><circle fill="#000000" cx="5" cy="12" r="2"/><circle fill="#000000" cx="12" cy="12" r="2"/><circle fill="#000000" cx="19" cy="12" r="2"/></g></svg></a>
									<ul className="dropdown-menu dropdown-menu-end">
										<li className="dropdown-item"><i className="fa fa-user-circle text-primary me-2"></i> View profile</li>
										<li className="dropdown-item"><i className="fa fa-users text-primary me-2"></i> Add to btn-close friends</li>
										<li className="dropdown-item"><i className="fa fa-plus text-primary me-2"></i> Add to group</li>
										<li className="dropdown-item"><i className="fa fa-ban text-primary me-2"></i> Block</li>
									</ul>
								</div>
							</div>
							<div className="card-body msg_card_body dlab-scroll" id="DLAB_W_Contacts_Body3">
								<div className="d-flex justify-content-start mb-4">
									<div className="img_cont_msg">
										<img src="/images/avatar/1.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
									<div className="msg_cotainer">
										Hi, how are you samim?
										<span className="msg_time">8:40 AM, Today</span>
									</div>
								</div>
								<div className="d-flex justify-content-end mb-4">
									<div className="msg_cotainer_send">
										Hi Khalid i am good tnx how about you?
										<span className="msg_time_send">8:55 AM, Today</span>
									</div>
									<div className="img_cont_msg">
								<img src="/images/avatar/2.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
								</div>
								<div className="d-flex justify-content-start mb-4">
									<div className="img_cont_msg">
										<img src="/images/avatar/1.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
									<div className="msg_cotainer">
										I am good too, thank you for your chat template
										<span className="msg_time">9:00 AM, Today</span>
									</div>
								</div>
								<div className="d-flex justify-content-end mb-4">
									<div className="msg_cotainer_send">
										You are welcome
										<span className="msg_time_send">9:05 AM, Today</span>
									</div>
									<div className="img_cont_msg">
								<img src="/images/avatar/2.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
								</div>
								<div className="d-flex justify-content-start mb-4">
									<div className="img_cont_msg">
										<img src="/images/avatar/1.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
									<div className="msg_cotainer">
										I am looking for your next templates
										<span className="msg_time">9:07 AM, Today</span>
									</div>
								</div>
								<div className="d-flex justify-content-end mb-4">
									<div className="msg_cotainer_send">
										Ok, thank you have a good day
										<span className="msg_time_send">9:10 AM, Today</span>
									</div>
									<div className="img_cont_msg">
										<img src="/images/avatar/2.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
								</div>
								<div className="d-flex justify-content-start mb-4">
									<div className="img_cont_msg">
										<img src="/images/avatar/1.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
									<div className="msg_cotainer">
										Bye, see you
										<span className="msg_time">9:12 AM, Today</span>
									</div>
								</div>
								<div className="d-flex justify-content-start mb-4">
									<div className="img_cont_msg">
										<img src="/images/avatar/1.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
									<div className="msg_cotainer">
										Hi, how are you samim?
										<span className="msg_time">8:40 AM, Today</span>
									</div>
								</div>
								<div className="d-flex justify-content-end mb-4">
									<div className="msg_cotainer_send">
										Hi Khalid i am good tnx how about you?
										<span className="msg_time_send">8:55 AM, Today</span>
									</div>
									<div className="img_cont_msg">
								<img src="/images/avatar/2.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
								</div>
								<div className="d-flex justify-content-start mb-4">
									<div className="img_cont_msg">
										<img src="/images/avatar/1.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
									<div className="msg_cotainer">
										I am good too, thank you for your chat template
										<span className="msg_time">9:00 AM, Today</span>
									</div>
								</div>
								<div className="d-flex justify-content-end mb-4">
									<div className="msg_cotainer_send">
										You are welcome
										<span className="msg_time_send">9:05 AM, Today</span>
									</div>
									<div className="img_cont_msg">
								<img src="/images/avatar/2.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
								</div>
								<div className="d-flex justify-content-start mb-4">
									<div className="img_cont_msg">
										<img src="/images/avatar/1.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
									<div className="msg_cotainer">
										I am looking for your next templates
										<span className="msg_time">9:07 AM, Today</span>
									</div>
								</div>
								<div className="d-flex justify-content-end mb-4">
									<div className="msg_cotainer_send">
										Ok, thank you have a good day
										<span className="msg_time_send">9:10 AM, Today</span>
									</div>
									<div className="img_cont_msg">
										<img src="/images/avatar/2.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
								</div>
								<div className="d-flex justify-content-start mb-4">
									<div className="img_cont_msg">
										<img src="/images/avatar/1.jpg" className="rounded-circle user_img_msg" alt="" />
									</div>
									<div className="msg_cotainer">
										Bye, see you
										<span className="msg_time">9:12 AM, Today</span>
									</div>
								</div>
							</div>
							<div className="card-footer type_msg">
								<div className="input-group">
									<textarea className="form-control" placeholder="Type your message..."></textarea>
									<div className="input-group-append">
										<button type="button" className="btn btn-primary"><i className="fa fa-location-arrow"></i></button>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="tab-pane fade" id="alerts" role="tabpanel">
						<div className="card mb-sm-3 mb-md-0 contacts_card">
							<div className="card-header chat-list-header text-center">
								<a href="#"><svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="18px" height="18px" viewBox="0 0 24 24" version="1.1"><g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"><rect x="0" y="0" width="24" height="24"/><circle fill="#000000" cx="5" cy="12" r="2"/><circle fill="#000000" cx="12" cy="12" r="2"/><circle fill="#000000" cx="19" cy="12" r="2"/></g></svg></a>
								<div>
									<h6 className="mb-1">Notications</h6>
									<p className="mb-0">Show All</p>
								</div>
								<a href="#"><svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="18px" height="18px" viewBox="0 0 24 24" version="1.1"><g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"><rect x="0" y="0" width="24" height="24"/><path d="M14.2928932,16.7071068 C13.9023689,16.3165825 13.9023689,15.6834175 14.2928932,15.2928932 C14.6834175,14.9023689 15.3165825,14.9023689 15.7071068,15.2928932 L19.7071068,19.2928932 C20.0976311,19.6834175 20.0976311,20.3165825 19.7071068,20.7071068 C19.3165825,21.0976311 18.6834175,21.0976311 18.2928932,20.7071068 L14.2928932,16.7071068 Z" fill="#000000" fillRule="nonzero" opacity="0.3"/><path d="M11,16 C13.7614237,16 16,13.7614237 16,11 C16,8.23857625 13.7614237,6 11,6 C8.23857625,6 6,8.23857625 6,11 C6,13.7614237 8.23857625,16 11,16 Z M11,18 C7.13400675,18 4,14.8659932 4,11 C4,7.13400675 7.13400675,4 11,4 C14.8659932,4 18,7.13400675 18,11 C18,14.8659932 14.8659932,18 11,18 Z" fill="#000000" fillRule="nonzero"/></g></svg></a>
							</div>
							<div className="card-body contacts_body p-0 dlab-scroll" id="DLAB_W_Contacts_Body1">
								<ul className="contacts">
									<li className="name-first-letter">SEVER STATUS</li>
									<li className="active">
										<div className="d-flex bd-highlight">
											<div className="img_cont primary">KK</div>
											<div className="user_info">
												<span>David Nester Birthday</span>
												<p className="text-primary">Today</p>
											</div>
										</div>
									</li>
									<li className="name-first-letter">SOCIAL</li>
									<li>
										<div className="d-flex bd-highlight">
											<div className="img_cont success">RU</div>
											<div className="user_info">
												<span>Perfection Simplified</span>
												<p>Jame Smith commented on your status</p>
											</div>
										</div>
									</li>
									<li className="name-first-letter">SEVER STATUS</li>
									<li>
										<div className="d-flex bd-highlight">
											<div className="img_cont primary">AU</div>
											<div className="user_info">
												<span>AharlieKane</span>
												<p>Sami is online</p>
											</div>
										</div>
									</li>
									<li>
										<div className="d-flex bd-highlight">
											<div className="img_cont info">MO</div>
											<div className="user_info">
												<span>Athan Jacoby</span>
												<p>Nargis left 30 mins ago</p>
											</div>
										</div>
									</li>
								</ul>
							</div>
							<div className="card-footer"></div>
						</div>
					</div>
					<div className="tab-pane fade" id="notes">
						<div className="card mb-sm-3 mb-md-0 note_card">
							<div className="card-header chat-list-header text-center">
								<a href="#"><svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="18px" height="18px" viewBox="0 0 24 24" version="1.1"><g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"><rect fill="#000000" x="4" y="11" width="16" height="2" rx="1"/><rect fill="#000000" opacity="0.3" transform="translate(12.000000, 12.000000) rotate(-270.000000) translate(-12.000000, -12.000000) " x="4" y="11" width="16" height="2" rx="1"/></g></svg></a>
								<div>
									<h6 className="mb-1">Notes</h6>
									<p className="mb-0">Add New Nots</p>
								</div>
								<a href="#"><svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="18px" height="18px" viewBox="0 0 24 24" version="1.1"><g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"><rect x="0" y="0" width="24" height="24"/><path d="M14.2928932,16.7071068 C13.9023689,16.3165825 13.9023689,15.6834175 14.2928932,15.2928932 C14.6834175,14.9023689 15.3165825,14.9023689 15.7071068,15.2928932 L19.7071068,19.2928932 C20.0976311,19.6834175 20.0976311,20.3165825 19.7071068,20.7071068 C19.3165825,21.0976311 18.6834175,21.0976311 18.2928932,20.7071068 L14.2928932,16.7071068 Z" fill="#000000" fillRule="nonzero" opacity="0.3"/><path d="M11,16 C13.7614237,16 16,13.7614237 16,11 C16,8.23857625 13.7614237,6 11,6 C8.23857625,6 6,8.23857625 6,11 C6,13.7614237 8.23857625,16 11,16 Z M11,18 C7.13400675,18 4,14.8659932 4,11 C4,7.13400675 7.13400675,4 11,4 C14.8659932,4 18,7.13400675 18,11 C18,14.8659932 14.8659932,18 11,18 Z" fill="#000000" fillRule="nonzero"/></g></svg></a>
							</div>
							<div className="card-body contacts_body p-0 dlab-scroll" id="DLAB_W_Contacts_Body2">
								<ul className="contacts">
									<li className="active">
										<div className="d-flex bd-highlight">
											<div className="user_info">
												<span>New order placed..</span>
												<p>10 Aug 2020</p>
											</div>
											<div className="ms-auto">
												<a href="#" className="btn btn-primary btn-xs sharp me-1"><i className="fas fa-pencil-alt"></i></a>
												<a href="#" className="btn btn-danger btn-xs sharp"><i className="fa fa-trash"></i></a>
											</div>
										</div>
									</li>
									<li>
										<div className="d-flex bd-highlight">
											<div className="user_info">
												<span>Youtube, a video-sharing website..</span>
												<p>10 Aug 2020</p>
											</div>
											<div className="ms-auto">
												<a href="#" className="btn btn-primary btn-xs sharp me-1"><i className="fas fa-pencil-alt"></i></a>
												<a href="#" className="btn btn-danger btn-xs sharp"><i className="fa fa-trash"></i></a>
											</div>
										</div>
									</li>
									<li>
										<div className="d-flex bd-highlight">
											<div className="user_info">
												<span>john just buy your product..</span>
												<p>10 Aug 2020</p>
											</div>
											<div className="ms-auto">
												<a href="#" className="btn btn-primary btn-xs sharp me-1"><i className="fas fa-pencil-alt"></i></a>
												<a href="#" className="btn btn-danger btn-xs sharp"><i className="fa fa-trash"></i></a>
											</div>
										</div>
									</li>
									<li>
										<div className="d-flex bd-highlight">
											<div className="user_info">
												<span>Athan Jacoby</span>
												<p>10 Aug 2020</p>
											</div>
											<div className="ms-auto">
												<a href="#" className="btn btn-primary btn-xs sharp me-1"><i className="fas fa-pencil-alt"></i></a>
												<a href="#" className="btn btn-danger btn-xs sharp"><i className="fa fa-trash"></i></a>
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
                    <div className="collapse navbar-collapse justify-content-between">
                        <div className="header-left">
							<div className="dashboard_bar">
                                Dashboard
                            </div>
                        </div>
                        <ul className="navbar-nav header-right">
							
							<li className="nav-item d-flex align-items-center">
								<div className="input-group search-area">
									<input type="text" className="form-control" placeholder="Search here..." />
									<span className="input-group-text"><a href="#"><i className="flaticon-381-search-2"></i></a></span>
								</div>
							</li>
							<li className="nav-item dropdown notification_dropdown">
                                <a className="nav-link bell dz-theme-mode" href="#">
									<i id="icon-light" className="fas fa-sun"></i>
                                    <i id="icon-dark" className="fas fa-moon"></i>
									
                                </a>
							</li>
							<li className="nav-item dropdown notification_dropdown">
                                <a className="nav-link " href="#" data-bs-toggle="dropdown">
									<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M26.7727 10.8757C26.7043 10.6719 26.581 10.4909 26.4163 10.3528C26.2516 10.2146 26.0519 10.1247 25.8393 10.0929L18.3937 8.95535L15.0523 1.83869C14.9581 1.63826 14.8088 1.46879 14.6218 1.35008C14.4349 1.23137 14.218 1.16833 13.9965 1.16833C13.775 1.16833 13.5581 1.23137 13.3712 1.35008C13.1842 1.46879 13.0349 1.63826 12.9407 1.83869L9.59934 8.95535L2.15367 10.0929C1.9416 10.1252 1.74254 10.2154 1.57839 10.3535C1.41423 10.4916 1.29133 10.6723 1.22321 10.8757C1.15508 11.0791 1.14436 11.2974 1.19222 11.5065C1.24008 11.7156 1.34468 11.9075 1.49451 12.061L6.92067 17.6167L5.63734 25.4777C5.60232 25.6934 5.6286 25.9147 5.7132 26.1162C5.79779 26.3177 5.93729 26.4914 6.1158 26.6175C6.29432 26.7436 6.50466 26.817 6.72287 26.8294C6.94108 26.8418 7.15838 26.7926 7.35001 26.6875L14 23.0149L20.65 26.6875C20.8416 26.7935 21.0592 26.8434 21.2779 26.8316C21.4965 26.8197 21.7075 26.7466 21.8865 26.6205C22.0655 26.4944 22.2055 26.3204 22.2903 26.1186C22.3751 25.9167 22.4014 25.695 22.3662 25.4789L21.0828 17.6179L26.5055 12.061C26.6546 11.9071 26.7585 11.715 26.8056 11.5059C26.8527 11.2968 26.8413 11.0787 26.7727 10.8757Z" fill="#717579"/>
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
                                <a className="nav-link" href="#" role="button" data-bs-toggle="dropdown">
									<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M23.3333 19.8333H23.1187C23.2568 19.4597 23.3295 19.065 23.3333 18.6666V12.8333C23.3294 10.7663 22.6402 8.75902 21.3735 7.12565C20.1068 5.49228 18.3343 4.32508 16.3333 3.80679V3.49996C16.3333 2.88112 16.0875 2.28763 15.6499 1.85004C15.2123 1.41246 14.6188 1.16663 14 1.16663C13.3812 1.16663 12.7877 1.41246 12.3501 1.85004C11.9125 2.28763 11.6667 2.88112 11.6667 3.49996V3.80679C9.66574 4.32508 7.89317 5.49228 6.6265 7.12565C5.35983 8.75902 4.67058 10.7663 4.66667 12.8333V18.6666C4.67053 19.065 4.74316 19.4597 4.88133 19.8333H4.66667C4.35725 19.8333 4.0605 19.9562 3.84171 20.175C3.62292 20.3938 3.5 20.6905 3.5 21C3.5 21.3094 3.62292 21.6061 3.84171 21.8249C4.0605 22.0437 4.35725 22.1666 4.66667 22.1666H23.3333C23.6428 22.1666 23.9395 22.0437 24.1583 21.8249C24.3771 21.6061 24.5 21.3094 24.5 21C24.5 20.6905 24.3771 20.3938 24.1583 20.175C23.9395 19.9562 23.6428 19.8333 23.3333 19.8333Z" fill="#717579"/>
										<path d="M9.9819 24.5C10.3863 25.2088 10.971 25.7981 11.6766 26.2079C12.3823 26.6178 13.1838 26.8337 13.9999 26.8337C14.816 26.8337 15.6175 26.6178 16.3232 26.2079C17.0288 25.7981 17.6135 25.2088 18.0179 24.5H9.9819Z" fill="#717579"/>
									</svg>
                                    <span className="badge light text-white bg-warning rounded-circle">12</span>
                                </a>
                                <div className="dropdown-menu dropdown-menu-end">
                                    <div id="DZ_W_Notification1" className="widget-media dlab-scroll p-3" style={{ height: "380px" }}>
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
													<div className="media me-2 media-info">
														KG
													</div>
													<div className="media-body">
														<h6 className="mb-1">Resport created successfully</h6>
														<small className="d-block">29 July 2020 - 02:26 PM</small>
													</div>
												</div>
											</li>
											<li>
												<div className="timeline-panel">
													<div className="media me-2 media-success">
														<i className="fa fa-home"></i>
													</div>
													<div className="media-body">
														<h6 className="mb-1">Reminder : Treatment Time!</h6>
														<small className="d-block">29 July 2020 - 02:26 PM</small>
													</div>
												</div>
											</li>
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
													<div className="media me-2 media-danger">
														KG
													</div>
													<div className="media-body">
														<h6 className="mb-1">Resport created successfully</h6>
														<small className="d-block">29 July 2020 - 02:26 PM</small>
													</div>
												</div>
											</li>
											<li>
												<div className="timeline-panel">
													<div className="media me-2 media-primary">
														<i className="fa fa-home"></i>
													</div>
													<div className="media-body">
														<h6 className="mb-1">Reminder : Treatment Time!</h6>
														<small className="d-block">29 July 2020 - 02:26 PM</small>
													</div>
												</div>
											</li>
										</ul>
									</div>
                                    <a className="all-notification" href="#">See all notifications <i className="ti-arrow-end"></i></a>
                                </div>
                            </li>
							<li className="nav-item dropdown notification_dropdown">
                                <a className="nav-link bell-link " href="#">
								<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M27.076 6.24662C26.962 5.48439 26.5787 4.78822 25.9955 4.28434C25.4123 3.78045 24.6679 3.50219 23.8971 3.5H4.10289C3.33217 3.50219 2.58775 3.78045 2.00456 4.28434C1.42137 4.78822 1.03803 5.48439 0.924011 6.24662L14 14.7079L27.076 6.24662Z" fill="#717579"/>
									<path d="M14.4751 16.485C14.3336 16.5765 14.1686 16.6252 14 16.6252C13.8314 16.6252 13.6664 16.5765 13.5249 16.485L0.875 8.30025V21.2721C0.875926 22.1279 1.2163 22.9484 1.82145 23.5536C2.42659 24.1587 3.24707 24.4991 4.10288 24.5H23.8971C24.7529 24.4991 25.5734 24.1587 26.1786 23.5536C26.7837 22.9484 27.1241 22.1279 27.125 21.2721V8.29938L14.4751 16.485Z" fill="#717579"/>
								</svg>
									<span className="badge light text-white bg-danger rounded-circle">76</span>
                                </a>
							</li>	
							
							
							<li className="nav-item dropdown notification_dropdown">
                                <a className="nav-link " href="#" data-bs-toggle="dropdown">
									<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M22.1666 5.83331H20.9999V3.49998C20.9999 3.19056 20.877 2.89381 20.6582 2.67502C20.4394 2.45623 20.1427 2.33331 19.8333 2.33331C19.5238 2.33331 19.2271 2.45623 19.0083 2.67502C18.7895 2.89381 18.6666 3.19056 18.6666 3.49998V5.83331H9.33325V3.49998C9.33325 3.19056 9.21034 2.89381 8.99154 2.67502C8.77275 2.45623 8.47601 2.33331 8.16659 2.33331C7.85717 2.33331 7.56042 2.45623 7.34163 2.67502C7.12284 2.89381 6.99992 3.19056 6.99992 3.49998V5.83331H5.83325C4.90499 5.83331 4.01476 6.20206 3.35838 6.85844C2.702 7.51482 2.33325 8.40506 2.33325 9.33331V10.5H25.6666V9.33331C25.6666 8.40506 25.2978 7.51482 24.6415 6.85844C23.9851 6.20206 23.0948 5.83331 22.1666 5.83331Z" fill="#717579"/>
										<path d="M2.33325 22.1666C2.33325 23.0949 2.702 23.9851 3.35838 24.6415C4.01476 25.2979 4.90499 25.6666 5.83325 25.6666H22.1666C23.0948 25.6666 23.9851 25.2979 24.6415 24.6415C25.2978 23.9851 25.6666 23.0949 25.6666 22.1666V12.8333H2.33325V22.1666Z" fill="#717579"/>
									</svg>
									<span className="badge light text-white bg-success rounded-circle">!</span>
                                </a>
								<div className="dropdown-menu dropdown-menu-end">
									<div id="DZ_W_TimeLine02" className="widget-timeline dlab-scroll style-1 ps ps--active-y p-3 height370">
										<ul className="timeline">
											<li>
												<div className="timeline-badge primary"></div>
												<a className="timeline-panel text-muted" href="#">
													<span>10 minutes ago</span>
													<h6 className="mb-0">Youtube, a video-sharing website, goes live <strong className="text-primary">$500</strong>.</h6>
												</a>
											</li>
											<li>
												<div className="timeline-badge info">
												</div>
												<a className="timeline-panel text-muted" href="#">
													<span>20 minutes ago</span>
													<h6 className="mb-0">New order placed <strong className="text-info">#XF-2356.</strong></h6>
													<p className="mb-0">Quisque a consequat ante Sit amet magna at volutapt...</p>
												</a>
											</li>
											<li>
												<div className="timeline-badge danger">
												</div>
												<a className="timeline-panel text-muted" href="#">
													<span>30 minutes ago</span>
													<h6 className="mb-0">john just buy your product <strong className="text-warning">Sell $250</strong></h6>
												</a>
											</li>
											<li>
												<div className="timeline-badge success">
												</div>
												<a className="timeline-panel text-muted" href="#">
													<span>15 minutes ago</span>
													<h6 className="mb-0">StumbleUpon is acquired by eBay. </h6>
												</a>
											</li>
											<li>
												<div className="timeline-badge warning">
												</div>
												<a className="timeline-panel text-muted" href="#">
													<span>20 minutes ago</span>
													<h6 className="mb-0">Mashable, a news website and blog, goes live.</h6>
												</a>
											</li>
											<li>
												<div className="timeline-badge dark">
												</div>
												<a className="timeline-panel text-muted" href="#">
													<span>20 minutes ago</span>
													<h6 className="mb-0">Mashable, a news website and blog, goes live.</h6>
												</a>
											</li>
										</ul>
									</div>
								</div>
							</li>
							
							<li className="nav-item dropdown  header-profile">
								<a className="nav-link" href="#" role="button" data-bs-toggle="dropdown">
									<img src="/images/user.jpg" width="56" alt="" />
								</a>
								<div className="dropdown-menu dropdown-menu-end">
									<a href="app-profile.html" className="dropdown-item ai-icon">
										<svg id="icon-user1" xmlns="http://www.w3.org/2000/svg" className="text-primary" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
										<span className="ms-2">Profile </span>
									</a>
									<a href="email-inbox.html" className="dropdown-item ai-icon">
										<svg id="icon-inbox" xmlns="http://www.w3.org/2000/svg" className="text-success" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
										<span className="ms-2">Inbox </span>
									</a>
									<a href="page-login.html" className="dropdown-item ai-icon">
										<svg id="icon-logout" xmlns="http://www.w3.org/2000/svg" className="text-danger" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
										<span className="ms-2">Logout </span>
									</a>
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
                    <li><a className="has-arrow " href="#" aria-expanded="false">
							<i className="fas fa-home"></i>
							<span className="nav-text">Dashboard</span>
						</a>
                        <ul aria-expanded="false">
							<li><a href="/">Dashboard</a></li>
							<li><a href="project-page.html">Project</a></li>
							<li><a href="contacts.html">Contacts</a></li>
							<li><a href="kanban.html">Kanban</a></li>
							<li><a href="calendar-page.html">Calendar</a></li>
							<li><a href="message.html">Messages</a></li>	
						</ul>

                    </li>
					<li>
						<a className="has-arrow" href="#" aria-expanded="false">
							<i className="fas fa-chart-line"></i>
							<span className="nav-text">CMS <span className="badge badge-xs badge-danger ms-2">New</span></span>
						</a>
                        <ul aria-expanded="false">
							 <li><a href="content.html">Content</a></li>
							<li><a href="content-add.html"> Add Content</a></li>
							<li><a href="menu-1.html">Menus</a></li>	
							<li><a href="email-template.html">Email Template</a></li>		
							<li><a href="add-email.html">Add Email</a></li>		
							<li><a href="blog.html">Blog</a></li>	
							<li><a href="add-blog.html">Add Blog</a></li>
							<li><a href="blog-category.html">Blog Category</a></li>	
						</ul>
                    </li>
                    <li><a className="has-arrow " href="#" aria-expanded="false">
						<i className="fas fa-info-circle"></i>
							<span className="nav-text">Apps</span>
						</a>
                        <ul aria-expanded="false">
                            <li><a href="app-profile.html">Profile</a></li>
                            <li><a href="edit-profile.html">Edit Profile</a></li>
							<li><a href="post-details.html">Post Details</a></li>
                            <li><a className="has-arrow" href="#" aria-expanded="false">Email</a>
                                <ul aria-expanded="false">
                                    <li><a href="email-compose.html">Compose</a></li>
                                    <li><a href="email-inbox.html">Inbox</a></li>
                                    <li><a href="email-read.html">Read</a></li>
                                </ul>
                            </li>
                            <li><a href="app-calender.html">Calendar</a></li>
							<li><a className="has-arrow" href="#" aria-expanded="false">Shop</a>
                                <ul aria-expanded="false">
                                    <li><a href="ecom-product-grid.html">Product Grid</a></li>
									<li><a href="ecom-product-list.html">Product List</a></li>
									<li><a href="ecom-product-detail.html">Product Details</a></li>
									<li><a href="ecom-product-order.html">Order</a></li>
									<li><a href="ecom-checkout.html">Checkout</a></li>
									<li><a href="ecom-invoice.html">Invoice</a></li>
									<li><a href="ecom-customers.html">Customers</a></li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                    <li><a className="has-arrow " href="#" aria-expanded="false">
							<i className="fas fa-chart-line"></i>
							<span className="nav-text">Charts</span>
						</a>
                        <ul aria-expanded="false">
                            <li><a href="chart-flot.html">Flot</a></li>
                            <li><a href="chart-morris.html">Morris</a></li>
                            <li><a href="chart-chartjs.html">Chartjs</a></li>
                            <li><a href="chart-chartist.html">Chartist</a></li>
                            <li><a href="chart-sparkline.html">Sparkline</a></li>
                            <li><a href="chart-peity.html">Peity</a></li>
                        </ul>
                    </li>
                    <li><a className="has-arrow " href="#" aria-expanded="false">
							<i className="fab fa-bootstrap"></i>
							<span className="nav-text">Bootstrap</span>
						</a>
                        <ul aria-expanded="false">
                            <li><a href="ui-accordion.html">Accordion</a></li>
                            <li><a href="ui-alert.html">Alert</a></li>
                            <li><a href="ui-badge.html">Badge</a></li>
                            <li><a href="ui-button.html">Button</a></li>
                            <li><a href="ui-modal.html">Modal</a></li>
                            <li><a href="ui-button-group.html">Button Group</a></li>
                            <li><a href="ui-list-group.html">List Group</a></li>
                            <li><a href="ui-card.html">Cards</a></li>
                            <li><a href="ui-carousel.html">Carousel</a></li>
                            <li><a href="ui-dropdown.html">Dropdown</a></li>
                            <li><a href="ui-popover.html">Popover</a></li>
                            <li><a href="ui-progressbar.html">Progressbar</a></li>
                            <li><a href="ui-tab.html">Tab</a></li>
                            <li><a href="ui-typography.html">Typography</a></li>
                            <li><a href="ui-pagination.html">Pagination</a></li>
                            <li><a href="ui-grid.html">Grid</a></li>

                        </ul>
                    </li>
                    <li><a className="has-arrow " href="#" aria-expanded="false">
							<i className="fas fa-heart"></i>
							<span className="nav-text">Plugins</span>
						</a>
                        <ul aria-expanded="false">
                            <li><a href="uc-select2.html">Select 2</a></li>
                            <li><a href="uc-nestable.html">Nestedable</a></li>
                            <li><a href="uc-noui-slider.html">Noui Slider</a></li>
                            <li><a href="uc-sweetalert.html">Sweet Alert</a></li>
                            <li><a href="uc-toastr.html">Toastr</a></li>
                            <li><a href="map-jqvmap.html">Jqv Map</a></li>
							<li><a href="uc-lightgallery.html">Light Gallery</a></li>
                        </ul>
                    </li>
                    <li><a href="widget-basic.html" aria-expanded="false">
							<i className="fas fa-user"></i>
							<span className="nav-text">Widget</span>
						</a>
					</li>
                    <li><a className="has-arrow " href="#" aria-expanded="false">
							<i className="fas fa-file-alt"></i>
							<span className="nav-text">Forms</span>
						</a>
                        <ul aria-expanded="false">
                            <li><a href="form-element.html">Form Elements</a></li>
                            <li><a href="form-wizard.html">Wizard</a></li>
                            <li><a href="form-ckeditor.html">CkEditor</a></li>
                            <li><a href="form-pickers.html">Pickers</a></li>
                            <li><a href="form-validation.html">Form Validate</a></li>
                        </ul>
                    </li>
                    <li><a className="has-arrow " href="#" aria-expanded="false">
							<i className="fas fa-table"></i>
							<span className="nav-text">Table</span>
						</a>
                        <ul aria-expanded="false">
                            <li><a href="table-bootstrap-basic.html">Bootstrap</a></li>
                            <li><a href="table-datatable-basic.html">Datatable</a></li>
                        </ul>
                    </li>
                    <li><a className="has-arrow " href="#" aria-expanded="false">
							<i className="fas fa-clone"></i>
							<span className="nav-text">Pages</span>
						</a>
                        <ul aria-expanded="false">
                            <li><a href="page-login.html">Login</a></li>
                            <li><a href="page-register.html">Register</a></li>
                            <li><a className="has-arrow" href="#" aria-expanded="false">Error</a>
                                <ul aria-expanded="false">
                                    <li><a href="page-error-400.html">Error 400</a></li>
                                    <li><a href="page-error-403.html">Error 403</a></li>
                                    <li><a href="page-error-404.html">Error 404</a></li>
                                    <li><a href="page-error-500.html">Error 500</a></li>
                                    <li><a href="page-error-503.html">Error 503</a></li>
                                </ul>
                            </li>
                            <li><a href="page-lock-screen.html">Lock Screen</a></li>
                            <li><a href="empty-page.html">Empty Page</a></li>
                        </ul>
                    </li>
                </ul>
				<div className="side-bar-profile">
					<div className="d-flex align-items-center justify-content-between mb-3">
						<div className="side-bar-profile-img">
							<img src="/images/user.jpg" alt="" />
						</div>
						<div className="profile-info1">
							<h5>Levi Siregar</h5>
							<span>leviregar@mail.com</span>
						</div>
						<div className="profile-button">
							<i className="fas fa-caret-downd scale5 text-light"></i>
						</div>
					</div>	
					<div className="d-flex justify-content-between mb-2 progress-info">
						<span className="fs-12"><i className="fas fa-star text-orange me-2"></i>Task Progress</span>
						<span className="fs-12">20/45</span>
					</div>
					<div className="progress default-progress">
						<div className="progress-bar bg-gradientf progress-animated" style={{ width: "45%", height: "8px" }} role="progressbar">
							<span className="sr-only">45% Complete</span>
						</div>
					</div>
				</div>
				
				<div className="copyright">
					<p>Fillow Saas Admin Ã‚Â© 2023 All Rights Reserved</p>
					<p className="fs-12">Made with <span className="heart"></span> by DexignLab</p>
				</div>
			</div>
        </div>
        
		
		
		
        <div className="content-body default-height">
            
			<div className="container-fluid">
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
													<span>Let Fillow manage your project automatically with our best AI systems </span>
													<a href="#" className="btn btn-rounded">Try Free Now</a>
												</div>
												<div className="col-xl-5 col-sm-5 ">
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
																<a className="nav-link active" data-bs-toggle="tab" href="#monthly" role="tab">Monthly</a>
															</li>
															<li className="nav-item">
																<a className="nav-link" data-bs-toggle="tab" href="#weekly" role="tab">Weekly</a>
															</li>
															<li className="nav-item">
																<a className="nav-link" data-bs-toggle="tab" href="#today" role="tab">Today</a>
															</li>
														</ul>
													</div>
													<div className="dropdown ms-2">
														<div className="btn-link" data-bs-toggle="dropdown">
															<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
																<circle cx="12.4999" cy="3.5" r="2.5" fill="#A5A5A5"/>
																<circle cx="12.4999" cy="11.5" r="2.5" fill="#A5A5A5"/>
																<circle cx="12.4999" cy="19.5" r="2.5" fill="#A5A5A5"/>
															</svg>
														</div>
														<div className="dropdown-menu dropdown-menu-right">
															<a className="dropdown-item" href="#">Delete</a>
															<a className="dropdown-item" href="#">Edit</a>
														</div>
													</div>
												</div>	
											</div>
											<div className="card-body">
												<div className="d-flex justify-content-between align-items-center flex-wrap">
													<div className="d-flex">
														<div className="d-inline-block position-relative donut-chart-sale mb-3">
															<span className="donut1" data-peity='{ "fill": ["rgba(136,108,192,1)", "rgba(241, 234, 255, 1)"],   "innerRadius": 20, "radius": 15}'>5/8</span>
														</div>
														<div className="ms-3">
															<h4 className="fs-24 mb-0">246</h4>
															<p className="mb-0">Total Projects</p>
														</div>
													</div>
													<div className="d-flex">	
														<div className="d-flex me-5">
															<div className="mt-2">
																<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
																	<circle cx="6.5" cy="6.5" r="6.5" fill="#FFCF6D"/>
																</svg>
															</div>
															<div className="ms-3">
																<h4 className="fs-24 mb-0 ">246</h4>
																<p className="mb-0">On Going</p>
															</div>
														</div>
														<div className="d-flex">
															<div className="mt-2">
																<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
																	<circle cx="6.5" cy="6.5" r="6.5" fill="#FFA7D7"/>
																</svg>

															</div>
															<div className="ms-3">
																<h4 className="fs-24 mb-0">28</h4>
																<p className="mb-0">Unfinished</p>
															</div>
														</div>
													</div>
												</div>
												<div id="chartBar" className="chartBar"></div>
												<div className="d-flex align-items-center">
													<label className="form-check-label form-label mb-0" htmlFor="flexSwitchCheckChecked1">Number</label>
													<div className="form-check form-switch toggle-switch">
														<input className="form-check-input custome" type="checkbox" id="flexSwitchCheckChecked1" defaultChecked />
													 
													</div>
													<label className="form-check-label form-label mb-0 ms-3" htmlFor="flexSwitchCheckChecked2">Analytics</label>	
													<div className="form-check form-switch toggle-switch">
													  <input className="form-check-input custome" type="checkbox" id="flexSwitchCheckChecked2" defaultChecked />
													</div>
												</div>
											</div>
										</div>
									</div>
									<div className="col-xl-12">
										<div className="card">
											<div className="card-header border-0 pb-0">
												<h4 className="card-title mb-0">Completion Project Rate</h4>
												<div className="dropdown ">
													<div className="btn-link" data-bs-toggle="dropdown">
														<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
															<circle cx="12.4999" cy="3.5" r="2.5" fill="#A5A5A5"/>
															<circle cx="12.4999" cy="11.5" r="2.5" fill="#A5A5A5"/>
															<circle cx="12.4999" cy="19.5" r="2.5" fill="#A5A5A5"/>
														</svg>
													</div>
													<div className="dropdown-menu dropdown-menu-right">
														<a className="dropdown-item" href="#">Delete</a>
														<a className="dropdown-item" href="#">Edit</a>
													</div>
												</div>
											</div>
											<div className="card-body pb-0">
												<div id="revenueMap" className="revenueMap"></div>
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
													<a href="#" className="btn btn-outline-primary btn-rounded">View More</a>
												</div>
											</div>
											<div className="card-body px-0 pt-2">
												<div className="d-flex justify-content-between recent-emails">
													<div className="d-flex">
														<div className="profile-k">
															<span className="bg-success">K</span>	
														</div>
														<div className="ms-3">
															<a href="email-inbox.html"> <h4 className="fs-18 font-w500">How to improve project management flows</h4></a>
															<p className="text-black mb-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do<br /> eiusmod tempor incididunt ut labore et dolore magna aliqua...</p>
														</div>
													</div>
													<div className="email-check">
														<label className="like-btn mb-0">
															  <input type="checkbox" />
															  <span className="checkmark"></span>
														</label>
													</div>
												</div>
												<div className="d-flex justify-content-between recent-emails">
													<div className="d-flex">
														<div className="profile-k">
															<img src="/images/profile/small/pic6.jpg" alt="" />
														</div>
														<div className="ms-3">
															<a href="email-inbox.html"><h4 className="fs-18 font-w500">Fillow Final UseCase Diagram</h4></a>
															<p className="text-black mb-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do<br /> eiusmod tempor incididunt ut labore et dolore magna aliqua...</p>
															<div className="final-badge">
																<span className="badge text-black border"><i className="far fa-file-alt me-3"></i>Master_file.fig</span>
																<span className="badge text-black border"><i className="fas fa-image me-2"></i>CoverPreview.jpg</span>
																<span className="badge border bgl-primary font-w700">4 files more</span>
															</div>
														</div>
													</div>
													<div className="email-check">
														<label className="like-btn mb-0">
															  <input type="checkbox" />
															  <span className="checkmark"></span>
														</label>
													</div>
												</div>
												<div className="d-flex justify-content-between recent-emails">
													<div className="d-flex">
														<div className="profile-k">
															<span className="bg-warning">G</span>	
														</div>
														<div className="ms-3">
															<a href="email-inbox.html"><h4 className="fs-18 font-w500">Weekly Design Inspirations by Envato</h4></a>
															<p className="text-black mb-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do<br /> eiusmod tempor incididunt ut labore et dolore magna aliqua...</p>
														</div>
													</div>
													<div className="email-check">
														<label className="like-btn mb-0">
															  <input type="checkbox" />
															  <span className="checkmark"></span>
														</label>
													</div>
												</div>
												<div className="d-flex justify-content-between recent-emails">
													<div className="d-flex">
														<div className="profile-k">
															<img src="/images/profile/small/pic8.jpg" alt="" />
														</div>
														<div className="ms-3">
															<a href="email-inbox.html"><h4 className="fs-18 font-w500">How to improve project management flows</h4></a>
															<p className="text-black mb-0">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do<br /> eiusmod tempor incididunt ut labore et dolore magna aliqua...</p>
														</div>
													</div>
													<div className="email-check">
														<label className="like-btn mb-0">
															  <input type="checkbox" />
															  <span className="checkmark"></span>
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
																	<svg width="16" height="11" viewBox="0 0 21 11" fill="none" xmlns="http://www.w3.org/2000/svg">
																		<path d="M1.49217 11C0.590508 11 0.149368 9.9006 0.800944 9.27736L9.80878 0.66117C10.1954 0.29136 10.8046 0.291359 11.1912 0.661169L20.1991 9.27736C20.8506 9.9006 20.4095 11 19.5078 11H1.49217Z" fill="#09BD3C"/>
																	</svg>
																	<strong className="text-success">+0,5%</strong>
																</div>
															</div>
														</div>
														<div id="columnChart"></div>
													</div>
												</div>
											</div>
											<div className="col-xl-6 col-sm-6">
												<div className="card">
													<div className="card-body card-padding d-flex align-items-center justify-content-between">
														<div className="w-75">
															<h4 className="mb-3 text-nowrap">Total Clients</h4>
															<div className="progress default-progress">
																<div className="progress-bar bg-gradient1 progress-animated" style={{ width: "40%", height: "8px" }} role="progressbar">
																	<span className="sr-only">45% Complete</span>
																</div>
															</div>
															<div className="mt-2">
																<p className="mb-0"><strong className="text-danger me-2">76</strong>left from target</p>
																
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
													<div className="card-body d-flex px-4  justify-content-between">
														<div>
															<div className="">
																<h2 className="fs-32 font-w700 counter">562</h2>
																<h4 className="mb-0 text-nowrap">Total Clients</h4>
																<p className="mb-0"><strong className="text-danger">-2%</strong> than last month</p>
															</div>
														</div>
														<div id="NewCustomers"></div>
													</div>
												</div>
											</div>
											<div className="col-xl-6 col-sm-6">
												<div className="card">
													<div className="card-body d-flex px-4  justify-content-between">
														<div>
															<div className="">
																<h2 className="fs-32 font-w700 counter">892</h2>
																<h4 className="mb-0 text-nowrap">New Projects</h4>
																<p className="mb-0"><strong className="text-success">+2%</strong> than last month</p>
															</div>
														</div>
														<div id="NewCustomers1"></div>
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
														<div className=" owl-carousel card-slider">
															<div className="items">
																<h4 className="card-title mb-4">Fillow Company Profile Website Project</h4>
																<span className="fs-14 font-w400 text-black">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Id quibusdam eaque vero ullam odit nostrum nemo excepturi explicabo ipsum voluptas nihil quae doloremque ducimus. </span>
															</div>	
															<div className="items">
																<h4 className="fs-20 font-w700 mb-4">Fillow Company Profile Website Project</h4>
																<span className="fs-14 font-w400 text-black">Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ab autem, quae debitis voluptatum omnis, quaerat deserunt nam voluptates exercitationem facere sequi dolorem.  </span>
															</div>	
															<div className="items">
																<h4 className="fs-20 font-w700 mb-4">Fillow Company Profile Website Project</h4>
																<span className="fs-14 font-w400 text-black">Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ab autem, quae debitis voluptatum omnis, quaerat deserunt nam voluptates exercitationem facere sequi dolorem. </span>
															</div>	
														</div>
													</div>
													<div className="col-xl-6 redial col-sm-6 align-self-center">
														<div id="redial"></div>
														<span className="text-center d-block fs-18 font-w600">On Progress <small className="text-success">70%</small></span>	
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
														<div id="emailchart"> </div>
														<div className="mb-3 mt-4">
															<h4>Legend</h4>
														</div>
														<div className="email-lagend">
															<div className="d-flex align-items-center justify-content-between mb-3">
																<span className="fs-16 text-gray">	
																	<svg className="me-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
																		<rect width="20" height="20" rx="6" fill="#886CC0"/>
																	</svg>
																	Primary (27%)
																</span>
																<h5 className="mb-0 font-w600">763</h5>
															</div>
															<div className="d-flex align-items-center justify-content-between  mb-3">
																<span className="fs-16 text-gray">	
																	<svg className="me-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
																		<rect width="20" height="20" rx="6" fill="#26E023"/>
																	</svg>
																	Promotion (11%)
																</span>
																<h5 className="mb-0 font-w600">321</h5>
															</div>
															<div className="d-flex align-items-center justify-content-between  mb-3">
																<span className="fs-16 text-gray">	
																	<svg className="me-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
																		<rect width="20" height="20" rx="6" fill="#61CFF1"/>
																	</svg>
																	Forum (22%)
																</span>
																<h5 className="mb-0 font-w600">69</h5>
															</div>
															<div className="d-flex align-items-center justify-content-between  mb-3">
																<span className="fs-16 text-gray">	
																	<svg className="me-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
																		<rect width="20" height="20" rx="6" fill="#FFDA7C"/>
																	</svg>
																	Socials (15%) 
																</span>
																<h5 className="mb-0 font-w600">154</h5>
															</div>
															<div className="d-flex align-items-center justify-content-between  mb-0 spam">
																<span className="fs-16 text-gray">	
																	<svg className="me-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
																		<rect width="20" height="20" rx="6" fill="#FF86B1"/>
																	</svg>
																	Spam (25%) 
																</span>
																<h5 className="mb-0 font-w600">696</h5>
															</div>
														</div>
														
													</div>
													<div className="card-footer border-0 pt-0">
														<a href="#" className="btn btn-outline-primary btn-rounded d-block">Update Progress</a>		
														
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
																		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
																			<circle cx="12.4999" cy="3.5" r="2.5" fill="#A5A5A5"/>
																			<circle cx="12.4999" cy="11.5" r="2.5" fill="#A5A5A5"/>
																			<circle cx="12.4999" cy="19.5" r="2.5" fill="#A5A5A5"/>
																		</svg>
																	</div>
																	<div className="dropdown-menu dropdown-menu-right">
																		<a className="dropdown-item" href="#">Delete</a>
																		<a className="dropdown-item" href="#">Edit</a>
																	</div>
																</div>
															</div>
															<h5 className="mt-3">Optimization Dashboard Page for indexing in Google</h5>
															<div className="projects">
																<span className="badge badge-warning light me-3">SEO</span>
																<span className="badge badge-danger light">MARKETING</span>
															</div>
															<div className="mt-3">
																<div className="progress default-progress">
																	<div className="progress-bar bg-gradient1 progress-animated" style={{ width: "45%", height: "5px" }} role="progressbar">
																		<span className="sr-only">45% Complete</span>
																	</div>
																</div>
																<div className="d-flex align-items-end mt-3 justify-content-between">
																	<p className="mb-0"><strong className="text-black me-2">12</strong>Task Done</p>
																	<p className="mb-0">Due date: 12/05/2020</p>
																</div>
															</div>
														</div>	
														<hr />
														<div className="project-details"> 
															<div className="d-flex align-items-center justify-content-between">
																<div className="d-flex align-items-center">
																	<span className="big-wind">
																		<img src="/images/circle-hunt.png" alt="" />
																	</span>
																	<div className="ms-3">
																		<h5 className="mb-1">Circle Hunt</h5>
																		<p className="mb-0">Creative Agency</p>
																	</div>
																</div>	
																<div className="dropdown">
																	<div className="btn-link" data-bs-toggle="dropdown">
																		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
																			<circle cx="12.4999" cy="3.5" r="2.5" fill="#A5A5A5"/>
																			<circle cx="12.4999" cy="11.5" r="2.5" fill="#A5A5A5"/>
																			<circle cx="12.4999" cy="19.5" r="2.5" fill="#A5A5A5"/>
																		</svg>
																	</div>
																	<div className="dropdown-menu dropdown-menu-right">
																		<a className="dropdown-item" href="#">Delete</a>
																		<a className="dropdown-item" href="#">Edit</a>
																	</div>
																</div>
															</div>
															<h5 className="mt-3">Redesign Landing Page Website for Company Profile</h5>
															<div className="projects">
																<span className="badge badge-primary light me-3">UI/UX</span>
																<span className="badge badge-danger light">WEBSITE</span>
															</div>
															<div className="mt-3">
																<div className="progress default-progress">
																	<div className="progress-bar bg-gradient1 progress-animated" style={{ width: "45%", height: "5px" }} role="progressbar">
																		<span className="sr-only">45% Complete</span>
																	</div>
																</div>
																<div className="d-flex align-items-end mt-3 justify-content-between">
																	<p className="mb-0"><strong className="text-black me-2">12</strong>Task Done</p>
																	<p className="mb-0">Due date: 12/05/2020</p>
																</div>
															</div>
														</div>	
														<hr />
													</div>
													<div className="card-footer pt-0 border-0">
														<a href="#" className="btn btn-outline-primary btn-rounded d-block">Pin other projects</a>
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
													<a href="#" className="btn btn-primary btn-rounded" data-bs-toggle="modal" data-bs-target="#sendMessageModal" >+ New Messages</a>
												</div>
											</div>
											<div className="card-body px-0 pt-0">
												<div className="msg-bx d-flex justify-content-between align-items-center">
													<div className="msg d-flex align-items-center w-100">
														<div className="image-box active">
															<img src="/images/profile/small/pic6.jpg" alt="" />
														</div>
														<div className="ms-3 w-100 ">
															<a href="app-profile.html"><h5 className="mb-1">Maren Rosser</h5></a>
															<div className="d-flex justify-content-between">
																<p className="me-auto mb-0 text-black">Hei, dont forget to clear server cache!</p>
																<small className="me-4">25min ago</small>
															</div>
														</div>
														
													</div>
													<div className="dropdown">
														<div className="btn-link" data-bs-toggle="dropdown">
															<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
																<circle cx="12.4999" cy="3.5" r="2.5" fill="#A5A5A5"/>
																<circle cx="12.4999" cy="11.5" r="2.5" fill="#A5A5A5"/>
																<circle cx="12.4999" cy="19.5" r="2.5" fill="#A5A5A5"/>
															</svg>
														</div>
														<div className="dropdown-menu dropdown-menu-right">
															<a className="dropdown-item" href="#">Delete</a>
															<a className="dropdown-item" href="#">Edit</a>
														</div>
													</div>
												</div>
												<div className="msg-bx d-flex justify-content-between align-items-center">
													<div className="msg d-flex align-items-center w-100">
														<div className="image-box">
															<img src="/images/profile/small/pic7.jpg" alt="" />
														</div>	
														<div className="ms-3 w-100">
															<a href="app-profile.html"><h5 className="mb-1">Kaiya Bergson</h5></a>
															<div className="d-flex justify-content-between">
																<p className="me-auto mb-0 text-black">I remember that project due is tomorrow.</p>
																<small className="me-4">Yesterday, 8:24 AM</small>
															</div>
														</div>
													</div>
													<div className="dropdown">
														<div className="btn-link" data-bs-toggle="dropdown">
															<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
																<circle cx="12.4999" cy="3.5" r="2.5" fill="#A5A5A5"/>
																<circle cx="12.4999" cy="11.5" r="2.5" fill="#A5A5A5"/>
																<circle cx="12.4999" cy="19.5" r="2.5" fill="#A5A5A5"/>
															</svg>
														</div>
														<div className="dropdown-menu dropdown-menu-right">
															<a className="dropdown-item" href="#">Delete</a>
															<a className="dropdown-item" href="#">Edit</a>
														</div>
													</div>
												</div>
												<div className="msg-bx d-flex justify-content-between align-items-center">
													<div className="msg d-flex align-items-center w-100">
														<div className="image-box active">
															<img src="/images/profile/small/pic4.jpg" alt="" />
														</div>	
														<div className="ms-3 w-100">
															<a href="app-profile.html"><h5 className="mb-1">Ruben Press</h5></a>
															<div className="d-flex justify-content-between">
																<p className="me-auto mb-0 text-black">Ok sir. I will fix it as soon as possible</p>
																<small className="me-4">December 12th, 2020  10:24 AM</small>
															</div>
														</div>
													</div>
													<div className="dropdown">
														<div className="btn-link" data-bs-toggle="dropdown">
															<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
																<circle cx="12.4999" cy="3.5" r="2.5" fill="#A5A5A5"/>
																<circle cx="12.4999" cy="11.5" r="2.5" fill="#A5A5A5"/>
																<circle cx="12.4999" cy="19.5" r="2.5" fill="#A5A5A5"/>
															</svg>
														</div>
														<div className="dropdown-menu dropdown-menu-right">
															<a className="dropdown-item" href="#">Delete</a>
															<a className="dropdown-item" href="#">Edit</a>
														</div>
													</div>
												</div>
												<div className="msg-bx d-flex justify-content-between align-items-center">
													<div className="msg d-flex align-items-center w-100">
														<div className="image-box active">
															<img src="/images/profile/small/pic3.jpg" alt="" />
														</div>	
														<div className="ms-3 w-100">
															<a href="app-profile.html"><h5 className="mb-1">Cristofer Torff</h5></a>
															<div className="d-flex justify-content-between">
																<p className="me-auto mb-0 text-black">Maybe we should schedule that meeting</p>
																<small className="me-4">December 12th, 2020  10:24 AM</small>
															</div>
														</div>
													</div>
													<div className="dropdown">
														<div className="btn-link" data-bs-toggle="dropdown">
															<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
																<circle cx="12.4999" cy="3.5" r="2.5" fill="#A5A5A5"/>
																<circle cx="12.4999" cy="11.5" r="2.5" fill="#A5A5A5"/>
																<circle cx="12.4999" cy="19.5" r="2.5" fill="#A5A5A5"/>
															</svg>
														</div>
														<div className="dropdown-menu dropdown-menu-right">
															<a className="dropdown-item" href="#">Delete</a>
															<a className="dropdown-item" href="#">Edit</a>
														</div>
													</div>
												</div>
												<div className="msg-bx d-flex justify-content-between align-items-center">
													<div className="msg d-flex align-items-center w-100">
														<div className="image-box active">
															<img src="/images/profile/small/pic5.jpg" alt="" />
														</div>	
														<div className="ms-3 w-100">
															<a href="app-profile.html"><h5 className="mb-1">Ann Rosser</h5></a>
															<div className="d-flex justify-content-between">
																<p className="me-auto mb-0 text-black">I dontÃ¢â‚¬â„¢t know where that files saved dude.</p>
																<small className="me-4">Yesterday, 8:24 AM</small>
															</div>
														</div>
													</div>
													<div className="dropdown">
														<div className="btn-link" data-bs-toggle="dropdown">
															<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
																<circle cx="12.4999" cy="3.5" r="2.5" fill="#A5A5A5"/>
																<circle cx="12.4999" cy="11.5" r="2.5" fill="#A5A5A5"/>
																<circle cx="12.4999" cy="19.5" r="2.5" fill="#A5A5A5"/>
															</svg>
														</div>
														<div className="dropdown-menu dropdown-menu-right">
															<a className="dropdown-item" href="#">Delete</a>
															<a className="dropdown-item" href="#">Edit</a>
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
            </div>
        </div>
        
		
		<div className="modal fade" id="sendMessageModal">
			<div className="modal-dialog modal-dialog-centered" role="document">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title">Send Message</h5>
						<button type="button" className="btn-close" data-bs-dismiss="modal"></button>
					</div>
					<div className="modal-body">
						<form className="comment-form">
							<div className="row"> 
								<div className="col-lg-6">
									<div className="mb-3">
										<label className="text-black font-w600 form-label required">Name </label>
										<input type="text" className="form-control" defaultValue="Author" name="Author" placeholder="Author" />
									</div>
								</div>
								<div className="col-lg-6">
									<div className="mb-3">
										<label className="text-black font-w600 form-label">Email </label>
										<input type="text" className="form-control" defaultValue="Email" placeholder="Email" name="Email" />
									</div>
								</div>
								<div className="col-lg-12">
									<div className="mb-3">
										<label className="text-black font-w600 form-label">Comment</label>
										<textarea rows={8} className="form-control" name="comment" placeholder="Comment"></textarea>
									</div>
								</div>
								<div className="col-lg-12">
									<div className="mb-3 mb-0">
										<input type="submit" defaultValue="Post Comment" className="submit btn btn-primary" name="submit" />
									</div>
								</div>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
        
        <div className="footer">
            <div className="copyright text-center">
                <p className="mb-0">© 2026 — Where Insights Drive Action</p>
                <p className="mb-0">v1.2603.1</p>
            </div>
        </div>
        

		
		
        


	</div>
    

    
    
    
	


	
	
	
	
	
	
	
	
    
	
	
	
	
	
    
	
	


    </div>
  );
}

