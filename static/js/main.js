const API_AUTH_URL = "http://192.168.1.18:8000/sso";
const API_BAGS_URL = "http://192.168.1.18:8002/v1/dms-legacy-core-logs/get-bags";
const INITIAL_QUERY_PARAMS = {
    page: 1,
    per_page: 20,
    bag_id: "",
    bag_category: "All",
    bag_type: "All",
    handling: "All",
    status: "All",
    dest_branch_code: ""
}


$(document).ready(function () {
    let token = getCookie("access");
    console.log("Access token:", token);
    if (!token) {
        console.log("No token found. Showing login form.");
        // Show only the login backdrop and login form
        $("#login-container").show();
        // $(".backdrop").hide(); // Hide other backdrops
        // $("#login-container").parent().show(); // Show the specific login backdrop
        $(".login-form").show();
        $(".authenticating").hide();
    } else {
        $(".backdrop").show();
        $(".authenticating").show();
        verifyUser(token);
    }

    let queryParams = {
        page: 1,
        per_page: 20,
        bag_id: "",
        bag_category: "All",
        bag_type: "All",
        handling: "All",
        status: "All",
        dest_branch_code: ""
    };
    // Add click event to bag rows
    $(document).on("click", ".bag-row", function () {
        let bagId = $(this).attr("bag_id");
        console.log("Fetching bag details for:", bagId);
        let token = getCookie("access");
        console.log("Access token:", token);
        openBagItemsModal(bagId, token);
    });

    // Attach event to article row click
    $(document).on("click", ".bag-article-row", function () {
        let articleId = $(this).attr("article_id");
        console.log("Fetching article details for:", articleId);
        openArticleDetailsModal(articleId, token);
    });

    // Close modal on clicking the backdrop
    $(document).on("click", "#bag-items-backdrop", function (event) {
        if (event.target.id === "bag-items-backdrop") {
            closeBagItemsModal();
        }
    });

    // Function to close article details modal when clicking outside
    $(document).on("click", "#article-details-backdrop", function (event) {
        if (event.target.id === "article-details-backdrop") {
            closeArticleDetailsModal();
        }
    });


    $("#prevPage").click(() => { queryParams.page--; fetchBags(token, queryParams); });
    $("#nextPage").click(() => { queryParams.page++; fetchBags(token, queryParams); });
    $("#searchBagId").click(() => { queryParams.bag_id = $("#bagIdInput").val(); fetchBags(token, queryParams); });
    $("#searchDestBranch").click(() => { queryParams.dest_branch_code = $("#destBranchInput").val(); fetchBags(token, queryParams); });

    $('#login-btn').click(function () {
        // Get values from input fields
        console.log("Login button clicked");
        let phone = $('#phone').val().trim();
        let password = $('#password').val().trim();
        let errorMsg = $('#login-error');

        // Simple validation
        if (phone === '' || password === '') {
            errorMsg.text('Phone number and password are required.');
            return;
        }

        // API request payload
        let requestData = {
            phone_number: `+88${phone}`,
            password: password
        };
        console.log("Request data:", requestData);
        $.ajax({
            url: 'http://localhost:8000/sso/login-phone/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function (response) {
                if (response.status === "success") {
                    $(".backdrop").hide();
                    console.log("Login successful:", response);
                    // Store access and refresh tokens in cookies
                    document.cookie = `access=${response.access}; path=/`;
                    document.cookie = `refresh=${response.refresh}; path=/`;
                    // document.cookie = `access=${response.access}; path=/; Secure`;
                    // document.cookie = `refresh=${response.refresh}; path=/; Secure`;
                    fetchBags(response.access, queryParams);
                    // Redirect or show success message
                    // window.location.href = "/"; // Change this to the actual dashboard URL
                } else {
                    console.error("Login failed:", response);
                    errorMsg.text(response.message || 'Login failed. Please try again.');
                }
            },
            error: function (xhr) {
                console.error("Login request failed:", xhr);
                let errorText = xhr.responseJSON ? xhr.responseJSON.message : 'Login request failed.';
                errorMsg.text(errorText);
            }
        });
    });
    // verifyUser();


});



function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + "; path=/" + expires;
}

function deleteCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function verifyUser(token) {
    $.ajax({
        url: API_AUTH_URL + "/token-verify/",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ access: token }),
        success: function () {
            $(".authenticating").text("Authenticated. Redirecting...");
            $(".authenticating").hide();
            $(".backdrop").hide();
            showApp(token, INITIAL_QUERY_PARAMS);
        },
        error: function () {
            deleteCookie("access");
            $(".authenticating").hide();
            showLogin();
        }
    });
}

function showLogin() {
    $("#login-container").show();
    $("#app-container").hide();
}

function showApp(token, queryParams) {
    $("#login-container").hide();
    $("#app-container").show();
    $("#bagTable").hide();
    fetchBags(token, queryParams);
}

function constructQueryString(queryParams) {
    let url = `${API_BAGS_URL}/?page=${queryParams.page}&per_page=${queryParams.per_page}`;

    if (queryParams.bag_id) url += `&bag_id=${queryParams.bag_id}`;
    if (queryParams.dest_branch_code) url += `&dest_branch_code=${queryParams.dest_branch_code}`;
    if (queryParams.bag_category !== "All") url += `&bag_category=${queryParams.bag_category}`;
    if (queryParams.bag_type !== "All") url += `&bag_type=${queryParams.bag_type}`;
    if (queryParams.handling !== "All") url += `&handling=${queryParams.handling}`;
    if (queryParams.status !== "All") url += `&status=${queryParams.status}`;

    return url;
}

function fetchBags(token, queryParams) {
    let url = constructQueryString(queryParams);
    console.log("Fetching from URL:", url);

    $.ajax({
        url: url,
        type: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        success: function (response) {
            $("#bagTable").show();
            console.log("Data fetched successfully", response);
            updateBagTable(response.results);
            updatePagination(response.page, response.total, response.per_page);
        },
        error: function (e) {
            console.log("Error fetching data", e.responseJSON);
        }
    });
}

function updateBagTable(data) {
    $("#bagTable tbody").empty();
    if (data.length === 0) {
        $("#bagTable tbody").append("<tr><td colspan='6'>No records found</td></tr>");
        return;
    }

    data.forEach(bag => {
        $("#bagTable tbody").append(`
            <tr class="bag-row" bag_id="${bag.Bag_ID}">
                <td>${bag.Bag_ID}</td>
                <td>${bag.Create_Total_Item_Count}(${bag.Delivered_Item_Count})</td>
                <td>${bag.Create_Date} ${bag.Create_Time}</td>
                <td>${bag.Status}</td>
            </tr>
        `);
    });
}

// <td>${bag.Bag_Category}</td>
// <td>${bag.Bag_Type}</td>
// <td>${bag.Dest_Branch_Code}</td>



// Function to open modal and fetch bag items
function openBagItemsModal(bagId, token) {
    $("#bag-items-backdrop").show();
    $("#bag-items-table tbody").html('<tr><td colspan="3">Loading...</td></tr>'); // Show loading
    fetchBagItems(bagId, token);
}

// Function to fetch bag items
function fetchBagItems(bagId, token) {
    let url = `http://localhost:8002/v1/dms-legacy-core-logs/get-bag-items/?bag_id=${bagId}&page=1&per_page=15`;

    $.ajax({
        url: url,
        type: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        success: function (response) {
            console.log("Bag items fetched:", response);
            updateBagItemsTable(response.results, bagId);
        },
        error: function (e) {
            console.error("Error fetching bag items", e);
            $("#bag-items-table tbody").html('<tr><td colspan="3">Failed to load data</td></tr>');
        }
    });
}

// Function to update modal table
function updateBagItemsTable(data, bagId) {
    $(".bag-item-title").text(`Articles in ${bagId}`);
    let tbody = $("#bag-items-table tbody");
    tbody.empty();

    if (data.length === 0) {
        tbody.append("<tr><td colspan='3'>No records found</td></tr>");
        return;
    }

    data.forEach(item => {
        tbody.append(`
            <tr class="bag-article-row" article_id="${item.Item_Bag_ID}">
                <td>${item.Item_Bag_ID}</td>
                <td>${item.Status}</td>
                <td>${item.Booked_Create_Date}</td>
            </tr>
        `);
    });
}

// Function to close modal
function closeBagItemsModal() {
    $("#bag-items-backdrop").hide();
}


// Function to open article details modal
function openArticleDetailsModal(articleId, token) {
    $("#article-details-backdrop").show();
    $("#tracking-stepper").html('<p>Loading...</p>'); // Show loading state
    fetchArticleDetails(articleId, token);
}

// Function to fetch article details
function fetchArticleDetails(articleId, token) {
    let url = `http://localhost:8002/v1/dms-legacy-core-logs/get-bag-item-detail/?item_id=${articleId}`;

    $.ajax({
        url: url,
        type: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        success: function (response) {
            console.log("Article details fetched:", response);
            updateArticleDetailsModal(response);
        },
        error: function (e) {
            console.error("Error fetching article details", e);
            $("#tracking-stepper").html('<p>Failed to load data</p>');
        }
    });
}

// Function to update modal content
function updateArticleDetailsModal(data) {
    let details = data.article_details;
    let trackingLogs = data.tracking_logs;

    $("#article-item-id").text(details.Item_ID);
    $("#article-item-type").text(details.Item_Type);
    $("#article-vas-type").text(details.VAS_Type);

    // Check if optional fields should be displayed
    if (details.ben_name !== "0" || details.sen_name !== "0") {
        $("#optional-fields").show();
        $("#article-sen-name").text(details.sen_name);
        $("#article-sen-address").text(details.sen_address);
        $("#article-ben-name").text(details.ben_name);
        $("#article-ben-address").text(details.ben_address);
        $("#article-sen-contact").text(details.Sen_Contact);
        $("#article-status").text(details.Status_Item);
        $("#article-total-weight").text(`${details.Total_Weight} ${details.Unit_Weight}`);
        $("#article-total-charge").text(`৳ ${details.Total_Charge}`);
    } else {
        $("#optional-fields").hide();
    }

    // Construct vertical stepper
    let stepperHtml = trackingLogs.map(log => `
        <div class="step">
            <div class="step-circle"></div>
            <div class="step-content">
                <p><strong>${log.Status}</strong></p>
                <p>${log.Remarks}</p>
                <p><small>${log.Event_Date} ${log.Event_Time}</small></p>
                <p><small>${log.Branch_Info}</small></p>
            </div>
        </div>
    `).join("");

    $("#tracking-stepper").html(stepperHtml);
}

// Function to close article details modal
function closeArticleDetailsModal() {
    $("#article-details-backdrop").hide();
}


function updatePagination(currentPage, totalRecords, perPage) {
    let totalPages = Math.ceil(totalRecords / perPage);
    let paginationContainer = $(".pos-pagination");

    // Clear existing pagination buttons
    paginationContainer.find(".pos-pagination-btn, .pos-pagination-dots").remove();
    console.log("Total pages:", totalPages);
    console.log("Current page:", currentPage);
    console.log("Total records:", totalRecords);
    let paginationHtml = '';

    if (totalPages <= 6) {
        // Show all pages if 6 or less
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += `<button class="pos-pagination-btn ${i === currentPage ? 'page-active' : ''}" data-page="${i}">${i}</button>`;
        }
    } else {
        // First 4 pages
        for (let i = 1; i <= 4; i++) {
            paginationHtml += `<button class="pos-pagination-btn ${i === currentPage ? 'page-active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (currentPage > 4 && currentPage < totalPages - 2) {
            paginationHtml += `<span class="pos-pagination-dots">...</span>`;
            paginationHtml += `<button class="pos-pagination-btn active" data-page="${currentPage}">${currentPage}</button>`;
            paginationHtml += `<span class="pos-pagination-dots">...</span>`;
        } else {
            paginationHtml += `<span class="pos-pagination-dots">...</span>`;
        }

        // Last 2 pages
        paginationHtml += `<button class="pos-pagination-btn ${totalPages - 1 === currentPage ? 'page-active' : ''}" data-page="${totalPages - 1}">${totalPages - 1}</button>`;
        paginationHtml += `<button class="pos-pagination-btn ${totalPages === currentPage ? 'page-active' : ''}" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Append buttons before the next arrow
    $(".pos-pagination-arrow-next").before(paginationHtml);

    // Add event listeners to page buttons
    $(".pos-pagination-btn").click(function () {
        let token = getCookie("access");
        console.log("Access token:", token);
        let newPage = parseInt($(this).attr("data-page"));

        let queryParams = {
            page: 1,
            per_page: 20,
            bag_id: "",
            bag_category: "All",
            bag_type: "All",
            handling: "All",
            status: "All",
            dest_branch_code: ""
        };
        queryParams.page = newPage;
        fetchBags(token, queryParams);
    });

    // Disable prev/next buttons if necessary
    $("#prevPage").prop("disabled", currentPage === 1);
    $("#nextPage").prop("disabled", currentPage === totalPages);
}

