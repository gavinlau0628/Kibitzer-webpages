// Listen to new messages being created
const socket = io();
socket.on('test', message =>
	console.log('Someone created a message', message)
);
// Initialize our Feathers client application through Socket.io
// with hooks and authentication.
const client = feathers();

client.configure(feathers.socketio(socket));
client.configure(feathers.authentication({
	cookie: 'feathers-jwt'
}));

var user;
var profile_filter;

client.authenticate({
		strategy: 'jwt',
		accessToken: getCookie('feathers-jwt')
	}).then(function(response) {
		console.log(response);

		if(response.user) {
			user = response.user;
		}

		populateAccountInformation();
		LoadPageInformation();


	})
	.catch(error => {
		console.info('We have not logged in with OAuth, yet.  This means there\'s no cookie storing the accessToken.  As a result, feathersClient.authenticate() failed.');
		console.log(error);
		if(window.location.href != "https://www.aleosiss.us/" && error.className == "not-authenticated") {
			console.log("redirecting home...")
			window.location.href = "https://www.aleosiss.us/"
		}

	});

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}

function logout() {
	client.logout();
}

function updateSearchProfileDisplayTitle() {
	let title = document.getElementById('user_search_profile_list_title');
	if(profile_filter == 0) {
		title.innerHTML = "<i class=\"fa fa-file fa-fw w3-margin-right w3-xxlarge w3-text-teal\"></i>Your Search Profiles"
	}

	if(profile_filter == 1) {
		title.innerHTML = "<i class=\"fa fa-file fa-fw w3-margin-right w3-xxlarge w3-text-teal\"></i>Your Public Search Profiles"
	}

	if(profile_filter == 2) {
		title.innerHTML = "<i class=\"fa fa-file fa-fw w3-margin-right w3-xxlarge w3-text-teal\"></i>Your Private Search Profiles"
	}

	if(profile_filter == 3) {
		title.innerHTML = "<i class=\"fa fa-file fa-fw w3-margin-right w3-xxlarge w3-text-teal\"></i>Your Subscribed Search Profiles"
	}

}

// I can't get switch statements to work HaHAA
function getNotificationInterval(notificationInterval) {
	if(notificationInterval == 0) {
		return "Daily"
	}

	if(notificationInterval == 1) {
		return "Weekly"
	}

	if(notificationInterval == 2) {
		return "Monthly"
	}

	console.log("ERROR, invalid notification interval", notificationInterval);
}

function getSection(section) {
	if(section == 0) {
		return "Community"
	}
	if(section == 1) {
		return "Housing"
	}
	if(section == 2) {
		return "Jobs"
	}
	if(section == 3) {
		return "Personals"
	}
	if(section == 4) {
		return "For Sale"
	}
	if(section == 5) {
		return "Services"
	}
	if(section == 6) {
		return "Gigs"
	}
	if(section == 7) {
		return "Resumes"
	}
	
	console.log("ERROR, invalid section", section);
}

async function LoadPageInformation() {
	account = document.getElementById('search_profile_form');
	if(account) {
		profile_filter = 0;
		let sps = await client.service('search-profiles').find(queryObj = { query: { creatorUserId: user.id }} )
		sps.forEach(element => {
			addSearchProfile(element);
		});
		client.service('search-profiles').on('created', addSearchProfile);
	};

	subscriptions = document.getElementById('public_profile_results_container');
	if(subscriptions) {
		// Public Search Profiles don't populate the window by default, so do nothing
	}
}

document.addEventListener('click', async ev => {
	switch(ev.target.id) {
		case 'loginbutton': {
		  console.log(user);
		  if(user) {
			console.log("logging you out")
          	await client.logout();
		  	if(window.location.href != "https://www.aleosiss.us/") {
				window.location.href = "https://www.aleosiss.us/"
		  	}
		  } else {
			  console.log("logging you in")
			  window.location = "https://www.aleosiss.us/auth/google"
		  }

		  break;
		}

		case 'submit-new-search-profile': {

			let input_privacy = 0;
			if(document.getElementById('search-profile-input-form-privacy').checked) {
				input_privacy = 1;
			}
			// get sp from form
			const search_profile = {
				creatorUserId: user.id,
				whitelist: document.getElementById('search-profile-input-form-whitelist').value,
				blacklist: document.getElementById('search-profile-input-form-blacklist').value,
				location: document.getElementById('search-profile-input-form-location').value,
				state: document.getElementById('search-profile-input-form-state').value,
				radius: document.getElementById('search-profile-input-form-radius').value,
				privacy: input_privacy,
				section: document.getElementById('search-profile-input-form-section').value,
				notificationInterval: document.getElementById('search-profile-input-form-interval').value,
				name: document.getElementById('search-profile-input-form-name').value
			}

			console.log(search_profile);

			try {
				await client.service('search-profiles').create(search_profile);
				document.getElementById('search_profile_form').reset();
				//successText.style.display = 'block';
			} catch (err) {
				console.log(err)
				//failText.style.display = 'block';
			}

			break;
		}

		case 'filter-account-search-profiles-all': {
			if(profile_filter == 0) {
				return;
			}
			profile_filter = 0;
			clearSearchProfiles();
			try {
				let sps = await client.service('search-profiles').find(queryObj = { query: { 
					creatorUserId: user.id 
				}});
				//console.log(sps);

				sps.forEach(element => {
					addSearchProfile(element);
				});
			} catch (error) {
				console.log(error);
			}
			updateSearchProfileDisplayTitle();
			break;
		}

		case 'filter-account-search-profiles-public': {
			if(profile_filter == 1) {
				return;
			}
			profile_filter = 1;
			clearSearchProfiles();
			try {
				let sps = await client.service('search-profiles').find(queryObj = { query: { 
					creatorUserId: user.id, 
					privacy: 1 
				}});
				//console.log(sps);

				sps.forEach(element => {
					addSearchProfile(element);
				});
			} catch (error) {
				console.log(error);
			}
			updateSearchProfileDisplayTitle();
			break;
		}

		case 'filter-account-search-profiles-private': {
			if(profile_filter == 2) {
				return;
			}
			profile_filter = 2;
			clearSearchProfiles();
			try {
				let sps = await client.service('search-profiles').find(queryObj = { query: { 
					creatorUserId: user.id, 
					privacy: 0 
				}});
				//console.log(sps);

				sps.forEach(element => {
					addSearchProfile(element);
				});
			} catch (error) {
				console.log(error);
			}
			updateSearchProfileDisplayTitle();
			break;
		}

		case 'filter-account-search-profiles-subscribed': {
			if(profile_filter == 3) {
				return;
			}
			profile_filter = 3;
			clearSearchProfiles();
			try {
				let sps = await client.service('subscriptions').find(queryObj = { query: { 
					userId: user.id, 
					// we only need this field
					$select: ['searchProfileId']
				}}).then((data) => {
					console.log("Found the following subscriptions...")
					console.log(data);
					let list = [ ];
					// $in queryParam requires a list
					for(let i = 0; i < data.length; i++) {
						list.push(data[i].searchProfileId);
					}

					let sps = client.service('search-profiles').find(queryObj = {query: {
						id: {
							$in: list
						}
					}});

					return sps;
				});

				//console.log(sps);

				sps.forEach(element => {
					addSearchProfile(element);
				});
				
			} catch (error) {
				console.log(error);
			}
			updateSearchProfileDisplayTitle();
			break;
		}

		case 'query-search-profiles': {
			whitelist = document.getElementById('search-profile-input-form-whitelist').value;
			whitelistlist = whitelist.split(" ");
			search = "";

			console.log(whitelistlist);

			var results = "";
			for(let i = 0; i < whitelistlist.length; i++) {
				search = (whitelistlist[i]);
				let queryParams = {
					query: {
						whitelist: {
							$like: `%${search}%`
						},
						privacy: 1
					}
				}
				console.log(queryParams);
				let sps = await client.service('search-profiles').find(queryParams);
				console.log(sps);
				if(results === "") { 
					console.log("first iteration");
					results = sps; // first iteration
				} else {
					console.log(i + " iteration")
					results = results.concat(sps);
				}

			}

			
			clearSearchProfiles();
			console.log(results);
			results.forEach(element => {
				addSearchProfile(element);
			});
		}
	}
});

async function addSearchProfile(search_profile) {
	let privacy;
	if(search_profile.privacy == 1) {
		privacy = "Public";
	} else {
		privacy = "Private";
	}

	let subscribed = "Unsubscribe"
	// If the id is null, then we just created this page on the My Account page, so we're automatically subscribed
	if(search_profile.id !== null) {
		let subscription = await client.service('subscriptions').find(queryObj = { query: { 
			userId: user.id,
			searchProfileId: search_profile.id
		}});

		if(subscription.length > 0) {
			
			subscribed = "Unsubscribe"
		} else {
			subscribed = "Subscribe"
		}
	} else {
		subscribed = "Unsubscribe"
	}

	let interval = getNotificationInterval(search_profile.notificationInterval);
	let section = getSection(search_profile.section);

	let list = document.getElementById('user_search_profile_list');
	if(list) {
		list.insertAdjacentHTML('afterbegin', `
		<div class="w3-container w3-border w3-round-large  w3-margin-top" id="search_profile_container_${search_profile.id}">
		<div class="w3-cell-row" id="search_profile_display_wrapper_${search_profile.id}">
		  <div id="search_profile_name_${search_profile.id}" class="w3-container w3-cell w3-cell-middle">
			<h5 class="w3-opacity w3-text-teal"><b>Name: ${search_profile.name}</b></h5>
		  </div>
		  <div class="w3-container w3-cell w3-cell-middle">
			<p><i class="fa fa-calendar fa-fw w3-text-blue w3-tiny"></i><i class="w3-tiny">Created at: ${search_profile.createdAt}</i></p>
		  </div>
		  <div class="w3-container w3-cell w3-cell-middle" id="search_profile_subscription_container_${search_profile.id}">
		  <button class="w3-button w3-small w3-border w3-border-teal w3-round-large w3-hover-blue" id="toggle_subscription_search_profile_${search_profile.id}" onclick="toggleSubSearchProfile(this.id)">${subscribed}</button>
		  </div>
		  <div class="w3-container w3-cell w3-cell-middle" id="search_profile_privacy_container_${search_profile.id}">
			<p id="search_profile_privacy_${search_profile.id}"><i class="w3-tiny w3-text-blue">${privacy}</i></p>
		  </div>
		  <span style="display: inline;" class="w3-container w3-cell w3-text-teal w3-cell-middle" id="search_profile_options_${search_profile.id}">
			<button class="w3-button w3-small w3-border w3-border-teal w3-round-large w3-hover-blue" id="edit_search_profile_${search_profile.id}" onclick="editSearchProfile(this.id)">Edit</button>
			<button class="w3-button w3-small w3-border w3-border-teal w3-round-large w3-hover-blue" style="display:none" id="cancel_edit_search_profile_${search_profile.id}" style="display:none" onclick="cancelEditSearchProfile(this.id)">Cancel</button>
			<button class="w3-button w3-small w3-border w3-border-teal w3-round-large w3-hover-blue" style="display:none" id="submit_edit_search_profile_${search_profile.id}" style="display:none" onclick="submitEditSearchProfile(this.id)">Submit</button>
			<button class="w3-button w3-small w3-border w3-border-teal w3-round-large w3-hover-blue" id="remove_search_profile_${search_profile.id}" style="display:none" onclick="removeSearchProfile(this.id)">Remove</button>
		  </span>
		</div>
		<div class="w3-half w3-container w3-border-right" id="search_profile_left_${search_profile.id}">
		  <p id="search_profile_whitelist_${search_profile.id}"><i class="w3-text-teal"><b>Whitelist: </b></i>  ${search_profile.whitelist}</p>
		  <p id="search_profile_blacklist_${search_profile.id}"><i class="w3-text-teal"><b>Blacklist: </b></i>  ${search_profile.blacklist}</p>
		  <p id="search_profile_state_${search_profile.id}"><i class="w3-text-teal"><b>State: </b></i>  ${search_profile.state}</p>
		  <p id="search_profile_radius_${search_profile.id}"><i class="w3-text-teal"><b>Radius: </b></i>  ${search_profile.radius} miles</p>
		</div>
		<div class="w3-half w3-container" id="id="search_profile_right_${search_profile.id}">
			<p id="search_profile_section_${search_profile.id}"><i class="w3-text-teal"><b>Section: </b></i> ${section}</p>
			<p id="search_profile_location_${search_profile.id}"><i class="w3-text-teal"><b>Zipcode: </b></i> ${search_profile.location}</p>
			<p id="search_profile_email_${search_profile.id}"><i class="w3-text-teal"><b>Notification email: </b></i> ${user.email}</p>
			<p id="search_profile_interval_${search_profile.id}"><i class="w3-text-teal"><b>Notification interval: </b></i> ${interval}</p>
		</div>
	  <hr>
	  </div>

	  `);
	} else {
		console.log("couldn't find the user_search_profile_list")
	}

	document.getElementById('search_profile_display_wrapper_' + search_profile.id)._data = search_profile;
	document.getElementById('search_profile_display_wrapper_' + search_profile.id)._subscribed = subscribed;
}

function clearSearchProfiles() {
	let list = document.getElementById('user_search_profile_list');
	if(list) {
		let profiles = list.childNodes;
		if(profiles) {
			for(var i = 0; i < profiles.length; i++) {
				if(profiles[i].localName == "div") {
					profiles[i].parentElement.removeChild(profiles[i]);
				}
			};
		}
	}
}

function editSearchProfile(elementid)			{
	let search_profile = getSearchProfileForButtonID(elementid);

	let options = document.getElementById('search_profile_options_' + search_profile.id);
	if(!options) {
		console.log("Couldn't find options!")
		return;
	}

	let children = options.children;
	for (var i = 0; i < children.length; i++) {
		let element = children[i];
		if(element.id == 'edit_search_profile_' + search_profile.id) {
			element.style.display = 'none';
		} else {
			element.style.display = 'inline';
		}
	}

	let privacy_container = document.getElementById('search_profile_privacy_container_' + search_profile.id);
	if(search_profile.privacy == 1) {
		privacy_container.innerHTML = `
		<input id="search_profile_edit_form_privacy_${search_profile.id}" class="w3-check" checked="checked" type="checkbox">
		<label><i class="fa fa-eye"></i> Public</label>
		`;
	} else {
		privacy_container.innerHTML = `
		<input id="search_profile_edit_form_privacy_${search_profile.id}" class="w3-check" type="checkbox">
		<label><i class="fa fa-eye"></i> Public</label>
		`;
	}

	let name = document.getElementById('search_profile_name_' + search_profile.id);
	name.innerHTML = `<h5 class="w3-opacity w3-text-teal"><b>Name:</b><input style="width:100%;max-width:75%;" id="search_profile_edit_form_name_${search_profile.id}" placeholder="${search_profile.name}" type="text" required/></i></h5>`
	let name_edit_form = document.getElementById('search_profile_edit_form_name_' + search_profile.id);
	name_edit_form.value = search_profile.name;

	let whitelist = document.getElementById('search_profile_whitelist_' + search_profile.id);
	whitelist.innerHTML = `<i class="w3-text-teal"><b>Whitelist: </b> <input style="width:100%;max-width:75%;" id="search_profile_edit_form_whitelist_${search_profile.id}" placeholder="${search_profile.whitelist}" type="text" required/></i>`;
	let whitelist_edit_form = document.getElementById('search_profile_edit_form_whitelist_' + search_profile.id);
	whitelist_edit_form.value = search_profile.whitelist;

	let blacklist = document.getElementById('search_profile_blacklist_' + search_profile.id);
	blacklist.innerHTML = `<i class="w3-text-teal"><b>Blacklist: </b> <input style="width:100%;max-width:75%;" id="search_profile_edit_form_blacklist_${search_profile.id}" placeholder="${search_profile.blacklist}" type="text" required/></i>`;
	let blacklist_edit_form = document.getElementById('search_profile_edit_form_blacklist_' + search_profile.id);
	blacklist_edit_form.value = search_profile.blacklist;

	let state = document.getElementById('search_profile_state_' + search_profile.id);
	state.innerHTML = `
	<span style="display: inline;"><i class="w3-text-teal"><b>State: </b></i><select style="width:100%;max-width:75%;" id="search_profile_edit_form_state_${search_profile.id}" class="w3-select" name="State" required>
		<option value="" disabled="" selected="">Choose your State</option>
		<option value="AL">Alabama</option>
		<option value="AK">Alaska</option>
		<option value="AZ">Arizona</option>
		<option value="AR">Arkansas</option>
		<option value="CA">California</option>
		<option value="CO">Colorado</option>
		<option value="CT">Connecticut</option>
		<option value="DE">Delaware</option>
		<option value="FL">Florida</option>
		<option value="GA">Georgia</option>
		<option value="HI">Hawaii</option>
		<option value="ID">Idaho</option>
		<option value="IL">Illinois</option>
		<option value="IN">Indiana</option>
		<option value="IA">Iowa</option>
		<option value="KS">Kansas</option>
		<option value="KY">Kentucky</option>
		<option value="LA">Louisiana</option>
		<option value="ME">Maine</option>
		<option value="MD">Maryland</option>
		<option value="MA">Massachusetts</option>
		<option value="MI">Michigan</option>
		<option value="MN">Minnesota</option>
		<option value="MS">Mississippi</option>
		<option value="MO">Missouri</option>
		<option value="MT">Monotana</option>
		<option value="NE">Nebraska</option>
		<option value="NV">Nevada</option>
		<option value="NH">New Hampshire</option>
		<option value="NJ">New Jersey</option>
		<option value="NM">New Mexico</option>
		<option value="NY">New York</option>
		<option value="NC">North Carolina</option>
		<option value="ND">North Dakota</option>
		<option value="OH">Ohio</option>
		<option value="OK">Oklahoma</option>
		<option value="OR">Oregon</option>
		<option value="PA">Pennsylvania</option>
		<option value="RI">Rhode Island</option>
		<option value="SC">South Carolina</option>
		<option value="SD">South Dakota</option>
		<option value="TN">Tennessee</option>
		<option value="TX">Texas</option>
		<option value="UT">Utah</option>
		<option value="VT">Vermont</option>
		<option value="VA">Virginia</option>
		<option value="WA">Washington</option>
		<option value="WV">West Virginia</option>
		<option value="WI">Wisconsin</option>
		<option value="WY">Wyoming</option>
		<option value="DC">Washington DC</option>
		<option value="GU">Guam</option>
		<option value="PR">Puerto Rico</option>
		<option value="FM">Federated States of Micronesia</option>
	</select></span>`;
	let state_edit_form = document.getElementById('search_profile_edit_form_state_' + search_profile.id);
	state_edit_form.value = search_profile.state;

	let radius = document.getElementById('search_profile_radius_' + search_profile.id);
	radius.innerHTML = `<i class="w3-text-teal"><b>Radius: </b> <input id="search_profile_edit_form_radius_${search_profile.id}" placeholder="${search_profile.radius}" type="number" required/></i>`;
	let radius_edit_form = document.getElementById('search_profile_edit_form_radius_' + search_profile.id);
	radius_edit_form.value = search_profile.radius;


	let section = document.getElementById('search_profile_section_' + search_profile.id);
	section.innerHTML = `
	<span><i class="w3-text-teal"><b>Section: </b></i><select style="width:100%;max-width:75%;" id="search_profile_edit_form_section_${search_profile.id}" class="w3-select" name="Section" required>
		<option value="" disabled="" selected="">Choose your Section</option>
		<option value="0">Community</option>
		<option value="1">Housing</option>
		<option value="2">Jobs</option>
		<option value="3">Personals</option>
		<option value="4">For Sale</option>
		<option value="5">Services</option>
		<option value="6">Gigs</option>
		<option value="7">Resumes</option>
	</select></span>`;
	let section_edit_form = document.getElementById('search_profile_edit_form_section_' + search_profile.id);
	section_edit_form.value = search_profile.section;
	
	let location = document.getElementById('search_profile_location_' + search_profile.id);
	location.innerHTML = `<i class="w3-text-teal"><b>Zipcode: </b> <input id="search_profile_edit_form_location_${search_profile.id}" placeholder="${search_profile.location}" type="text" required/></i>`;
	let location_edit_form = document.getElementById('search_profile_edit_form_location_' + search_profile.id);
	location_edit_form.value = search_profile.location;

	let interval = document.getElementById('search_profile_interval_' + search_profile.id);
	interval.innerHTML = `
	<span><i class="w3-text-teal"><b>Interval: </b></i><select style="width:100%;max-width:75%;" id="search_profile_edit_form_interval_${search_profile.id}" class="w3-select" name="Notification" required>
		<option value="" disabled="" selected="${search_profile.notificationInterval}">Choose your interval</option>
		<option value="0">Daily</option>
		<option value="1">Weekly</option>
		<option value="2">Monthly</option>
	</select></span>`;
	let interval_edit_form = document.getElementById('search_profile_edit_form_interval_' + search_profile.id);
	interval_edit_form.value = search_profile.notificationInterval;
};

function cancelEditSearchProfile(elementid)	{
	let search_profile = getSearchProfileForButtonID(elementid);
	let subscribed = getSubscriptionStatusForButtonID(elementid);
	let search_profile_display_wrapper = document.getElementById(elementid).parentElement.parentElement;

	if(!search_profile_display_wrapper) {
		console.log("Couldn't find the wrapper to cancel the edit!");
		return;
	}

	let search_profile_container = search_profile_display_wrapper.parentElement;

	let privacy;
	if(search_profile.privacy == 1) {
		privacy = "Public";
	} else {
		privacy = "Private";
	}

	let interval = getNotificationInterval(search_profile.notificationInterval);
	let section = getSection(search_profile.section);

	search_profile_container.innerHTML =
	`
	<div class="w3-cell-row" id="search_profile_display_wrapper_${search_profile.id}">
		  <div id="search_profile_name_${search_profile.id}" class="w3-container w3-cell w3-cell-middle">
			<h5 class="w3-opacity w3-text-teal"><b>Name: ${search_profile.name}</b></h5>
		  </div>
		  <div class="w3-container w3-cell w3-cell-middle">
			<p><i class="fa fa-calendar fa-fw w3-text-blue w3-tiny"></i><i class="w3-tiny">Created at: ${search_profile.createdAt}</i></p>
		  </div>
		  <div class="w3-container w3-cell w3-cell-middle" id="search_profile_subscription_container_${search_profile.id}">
		  	<button class="w3-button w3-small w3-border w3-border-teal w3-round-large w3-hover-blue" id="toggle_subscription_search_profile_${search_profile.id}" onclick="toggleSubSearchProfile(this.id)">${subscribed}</button>
		  </div>
		  <div class="w3-container w3-cell w3-cell-middle" id="search_profile_privacy_container_${search_profile.id}">
			<p id="search_profile_privacy_${search_profile.id}"><i class="w3-tiny w3-text-blue">${privacy}</i></p>
		  </div>
		  <span style="display: inline;" class="w3-container w3-cell w3-text-teal w3-cell-middle" id="search_profile_options_${search_profile.id}">
			<button class="w3-button w3-small w3-border w3-border-teal w3-round-large w3-hover-blue" id="edit_search_profile_${search_profile.id}" onclick="editSearchProfile(this.id)">Edit</button>
			<button class="w3-button w3-small w3-border w3-border-teal w3-round-large w3-hover-blue" style="display:none" id="cancel_edit_search_profile_${search_profile.id}" style="display:none" onclick="cancelEditSearchProfile(this.id)">Cancel</button>
			<button class="w3-button w3-small w3-border w3-border-teal w3-round-large w3-hover-blue" style="display:none" id="submit_edit_search_profile_${search_profile.id}" style="display:none" onclick="submitEditSearchProfile(this.id)">Submit</button>
			<button class="w3-button w3-small w3-border w3-border-teal w3-round-large w3-hover-blue" id="remove_search_profile_${search_profile.id}" style="display:none" onclick="removeSearchProfile(this.id)">Remove</button>
		  </span>
		</div>
		<div class="w3-half w3-container w3-border-right" id="search_profile_left_${search_profile.id}">
		  <p id="search_profile_whitelist_${search_profile.id}"><i class="w3-text-teal"><b>Whitelist: </b></i>  ${search_profile.whitelist}</p>
		  <p id="search_profile_blacklist_${search_profile.id}"><i class="w3-text-teal"><b>Blacklist: </b></i>  ${search_profile.blacklist}</p>
		  <p id="search_profile_state_${search_profile.id}"><i class="w3-text-teal"><b>State: </b></i>  ${search_profile.state}</p>
		  <p id="search_profile_radius_${search_profile.id}"><i class="w3-text-teal"><b>Radius: </b></i>  ${search_profile.radius} miles</p>
		</div>
		<div class="w3-half w3-container" id="id="search_profile_right_${search_profile.id}">
			<p id="search_profile_section_${search_profile.id}"><i class="w3-text-teal"><b>Section: </b></i> ${section}</p>
			<p id="search_profile_location_${search_profile.id}"><i class="w3-text-teal"><b>Zipcode: </b></i> ${search_profile.location}</p>
			<p id="search_profile_email_${search_profile.id}"><i class="w3-text-teal"><b>Notification email: </b></i> ${user.email}</p>
			<p id="search_profile_interval_${search_profile.id}"><i class="w3-text-teal"><b>Notification interval: </b></i> ${interval}</p>
		</div>
	<hr>`

	document.getElementById('search_profile_display_wrapper_' + search_profile.id)._data = search_profile;
	document.getElementById('search_profile_display_wrapper_' + search_profile.id)._subscribed = subscribed;
};

async function submitEditSearchProfile(elementid)	{
	let old_search_profile = getSearchProfileForButtonID(elementid);

	let input_privacy = 0;
	if(document.getElementById('search_profile_edit_form_privacy_' + old_search_profile.id).checked) {
		input_privacy = 1;
	}

	let search_profile = old_search_profile;
	
	search_profile.whitelist = document.getElementById('search_profile_edit_form_whitelist_' + old_search_profile.id).value,
	search_profile.blacklist = document.getElementById('search_profile_edit_form_blacklist_' + old_search_profile.id).value,
	search_profile.location = document.getElementById('search_profile_edit_form_location_' + old_search_profile.id).value,
	search_profile.state = document.getElementById('search_profile_edit_form_state_' + old_search_profile.id).value,
	search_profile.radius = document.getElementById('search_profile_edit_form_radius_' + old_search_profile.id).value,
	search_profile.privacy = input_privacy,
	search_profile.section = document.getElementById('search_profile_edit_form_section_' + old_search_profile.id).value,
	search_profile.notificationInterval = document.getElementById('search_profile_edit_form_interval_' + old_search_profile.id).value,
	search_profile.name = document.getElementById('search_profile_edit_form_name_' + old_search_profile.id).value

	try {
		document.getElementById('search_profile_display_wrapper_' + search_profile.id)._data = search_profile;
		await client.service('search-profiles').update(old_search_profile.id, search_profile).then(() => {
			cancelEditSearchProfile(elementid);
		});
	} catch (err) {
		console.log(err);
	}
};

async function removeSearchProfile(elementid) {
	let search_profile = getSearchProfileForButtonID(elementid);
	try {
		await client.service('search-profiles').remove(search_profile.id).then(() => {
			let html = document.getElementById("search_profile_display_wrapper_" + search_profile.id);
			html.parentElement.parentElement.removeChild(html.parentElement);
		});
	} catch(err) {
		console.log(err);
	}
}

async function toggleSubSearchProfile(elementid) {
	let search_profile = getSearchProfileForButtonID(elementid);
	let subscribed = getSubscriptionStatusForButtonID(elementid);

	let subButton = document.getElementById("toggle_subscription_search_profile_" + search_profile.id);
	if(subscribed == "Unsubscribe") {
		let subscription = await client.service('subscriptions').find(queryObj = { query: { 
			userId: user.id,
			searchProfileId: search_profile.id
		}});

		console.log(subscription);
		console.log(JSON.stringify(subscription[0]));

		if(subscription.length > 0) {
			await client.service("subscriptions").remove(subscription[0].id);
			subButton.innerText = "Subscribe";
			document.getElementById(elementid).parentElement.parentElement._subscribed = "Subscribe";
		}
	} else {
		let subscription = {
			userId: user.id,
			searchProfileId: search_profile.id
		}

		await client.service('subscriptions').create(subscription);
		subButton.innerText = "Unsubscribe"
		document.getElementById(elementid).parentElement.parentElement._subscribed = "Unsubscribe"
	}

}

function getSearchProfileForButtonID(elementid) {
	search_profile = document.getElementById(elementid).parentElement.parentElement._data;
	if(!search_profile) {
		console.log("Couldn't find search profile object!");
		return;
	}

	return search_profile;
}

function getSubscriptionStatusForButtonID(elementid) {
	substatus = document.getElementById(elementid).parentElement.parentElement._subscribed;
	if(!substatus) {
		console.log("Couldn't find search profile object!");
		return;
	}

	return substatus;
}


async function populateAccountInformation() {
	try {
	document.getElementById('loginbutton').innerHTML = `<i class="fa fa-user-circle-o"></i> Hi ${user.forname}! (logout)`
	document.getElementById('accinfo_username').innerHTML += ` ${user.forname} ${user.surname}`;
	document.getElementById('accinfo_email').innerHTML += ` ${user.email}`;

	await client.service('search-profiles').find(queryObj = { query: { creatorUserId: user.id }} ).then((data) => {
		document.getElementById('accinfo_numprofiles').innerHTML += ` ${data.length} Search Profiles`;
	});

	} catch (error) {
		console.log(error);
	}
}
