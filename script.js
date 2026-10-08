
document.addEventListener('DOMContentLoaded', () => {

    // --- 0. Mobile Sidebar Logic ---
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    function openSidebar() {
        sidebar.classList.add('active-mobile');
        overlay.classList.add('active');
    }

    function closeSidebar() {
        sidebar.classList.remove('active-mobile');
        overlay.classList.remove('active');
    }

    mobileBtn.addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);


    // --- 1. Smart Responsive Live Clock ---
    const clockDisplay = document.querySelector('#clock-display span');
    function updateClock() {
        const now = new Date();
        const isMobile = window.innerWidth <= 768;

        const options = isMobile
            ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
            : { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };

        clockDisplay.textContent = now.toLocaleDateString('en-US', options);
    }
    setInterval(updateClock, 1000);
    updateClock();
    window.addEventListener('resize', updateClock);


    // --- 2. Dark Mode Toggle ---
    const themeBtn = document.getElementById('theme-btn');
    const htmlEl = document.documentElement;
    const themeIcon = themeBtn.querySelector('i');

    const savedTheme = localStorage.getItem('erp-theme') || 'light';
    htmlEl.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('erp-theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        }
    }

    // --- 3. Tab Navigation & Robust Search Logic with Highlighting ---
    const navItems = document.querySelectorAll('.nav-links li');
    const contentSections = document.querySelectorAll('.content-section');
    const searchInput = document.getElementById('universal-search');
    const searchResultsHeader = document.getElementById('search-results-header');
    const allItems = document.querySelectorAll('.searchable-item');
    const sectionHeaders = document.querySelectorAll('.section-header');
    let activeTabId = 'paths-section';

    // Store original HTML of search targets to allow clean un-highlighting
    const searchTargets = document.querySelectorAll('.search-target, .dynamic-node');
    searchTargets.forEach(target => {
        // Save original content in a data attribute
        target.dataset.originalHtml = target.innerHTML;
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (searchInput.value !== '') {
                searchInput.value = '';
                resetSearchMode();
            }
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            contentSections.forEach(section => section.classList.remove('active'));
            activeTabId = item.getAttribute('data-target');
            document.getElementById(activeTabId).classList.add('active');

            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Highlight Helper Function
    function highlightText(element, searchTerm) {
        const originalHtml = element.dataset.originalHtml;
        if (!searchTerm) {
            element.innerHTML = originalHtml;
            return;
        }

        // Temporary wrapper to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalHtml;

        // Function to recursively replace text inside nodes, ignoring HTML tags like <i>
        function walkDom(node) {
            if (node.nodeType === 3) { // Text node
                const text = node.nodeValue;
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                if (regex.test(text)) {
                    const newHtml = text.replace(regex, '<span class="search-highlight">$1</span>');
                    const replacementNode = document.createElement('span');
                    replacementNode.innerHTML = newHtml;
                    node.parentNode.replaceChild(replacementNode, node);
                }
            } else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
                for (let i = 0; i < node.childNodes.length; i++) {
                    walkDom(node.childNodes[i]);
                }
            }
        }
        walkDom(tempDiv);
        element.innerHTML = tempDiv.innerHTML;
    }


    searchInput.addEventListener('input', (e) => {
        // Escape special regex characters in the search term to prevent breaking the highlighting
        const rawTerm = e.target.value.trim();
        const searchTerm = rawTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchLower = rawTerm.toLowerCase();

        if (searchLower.length > 0) {
            searchResultsHeader.style.display = 'block';
            sectionHeaders.forEach(h => h.style.display = 'none');
            navItems.forEach(nav => nav.classList.remove('active'));

            let matchCount = 0;

            allItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(searchLower)) {
                    item.classList.remove('search-hidden');
                    item.closest('.content-section').classList.add('active');
                    matchCount++;

                    // Apply highlights to all text targets within this matched item
                    const targets = item.querySelectorAll('.search-target, .dynamic-node');
                    targets.forEach(target => highlightText(target, searchTerm));

                } else {
                    item.classList.add('search-hidden');
                    // Remove highlights if hidden
                    const targets = item.querySelectorAll('.search-target, .dynamic-node');
                    targets.forEach(target => highlightText(target, ''));
                }
            });

            contentSections.forEach(section => {
                const visibleItems = section.querySelectorAll('.searchable-item:not(.search-hidden)');
                if (visibleItems.length === 0) {
                    section.classList.remove('active');
                } else {
                    section.classList.add('active');
                }
            });

            document.getElementById('search-count').textContent = `Found ${matchCount} match${matchCount !== 1 ? 'es' : ''} across all categories.`;
        } else {
            resetSearchMode();
        }
    });

    function resetSearchMode() {
        searchResultsHeader.style.display = 'none';
        sectionHeaders.forEach(h => h.style.display = 'block');
        allItems.forEach(item => item.classList.remove('search-hidden'));
        contentSections.forEach(section => section.classList.remove('active'));
        document.getElementById(activeTabId).classList.add('active');
        navItems.forEach(nav => {
            if (nav.getAttribute('data-target') === activeTabId) {
                nav.classList.add('active');
            }
        });

        // Clear all highlights
        searchTargets.forEach(target => highlightText(target, ''));

        const clearBtn = document.getElementById('search-clear-btn');
        clearBtn.classList.remove('visible');
    }

    // --- 4. Global Keyboard Shortcut (Ctrl + /) ---
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();
            searchInput.focus();
        }
    });

    // --- 4.5 Search Clear Button ---
    const clearBtn = document.getElementById('search-clear-btn');
    searchInput.addEventListener('input', () => {
        if (searchInput.value.length > 0) {
            clearBtn.classList.add('visible');
        } else {
            clearBtn.classList.remove('visible');
        }
    });
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        resetSearchMode();
        searchInput.focus();
    });

    // --- Lightbox Modal Logic ---
const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-full-img');
const modalCaption = document.getElementById('modal-caption');
const modalDownloadBtn = document.getElementById('modal-download-btn');
const closeBtn = document.getElementById('modal-close');
const backdrop = document.getElementById('modal-backdrop');

// Select all "View" buttons inside the gallery
const viewButtons = document.querySelectorAll('.view-btn');

viewButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Find the closest card container to extract data
        const card = e.target.closest('.gallery-card');
        const imgEl = card.querySelector('.gallery-img');
        const descEl = card.querySelector('.gallery-desc');
        const downloadLink = card.querySelector('.download-btn').href;

        // Populate Modal Data
        modalImg.src = imgEl.src;
        modalCaption.textContent = descEl.textContent;
        modalDownloadBtn.href = downloadLink;

        // Open Modal
        modal.classList.add('active');
    });
});

// Close Modal Functions
function closeModal() {
    modal.classList.remove('active');
    setTimeout(() => { modalImg.src = ''; }, 300); // Clear source after animation
}

closeBtn.addEventListener('click', closeModal);
backdrop.addEventListener('click', closeModal);

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

    // --- Copy SQL to Clipboard ---
    const copySqlBtns = document.querySelectorAll('.copy-sql');
    copySqlBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Target the code block inside the specific IDE container clicked
            const codeBlock = e.target.closest('.ide-container').querySelector('.sql-code');
            const textToCopy = codeBlock.textContent;

            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                btn.style.color = 'var(--primary-color)';
                btn.style.borderColor = 'var(--primary-color)';

                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.style.color = '';
                    btn.style.borderColor = '';
                }, 2000);
            });
        });
    });

    // --- 6. Stretched Diagonal Path Generator ---
    function buildDiagonalPath(containerId, steps) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        steps.forEach((step, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'flow-step-wrapper';
            wrapper.style.setProperty('--index', index);

            const node = document.createElement('div');
            node.className = 'dynamic-node';
            if (index === steps.length - 1) node.classList.add('final-node');
            node.textContent = step;

            // SAVE ORIGINAL HTML FOR HIGHLIGHTING LATER!
            node.dataset.originalHtml = step;

            wrapper.appendChild(node);

            if (index < steps.length - 1) {
                const svgNS = "http://www.w3.org/2000/svg";
                const svg = document.createElementNS(svgNS, "svg");
                svg.setAttribute("class", "diag-arrow-svg");
                svg.setAttribute("viewBox", "0 0 100 25");

                const path = document.createElementNS(svgNS, "path");
                path.setAttribute("class", "diag-line");
                path.setAttribute("d", "M 30,0 C 30,12 75,12 75,25");

                const arrowHead = document.createElementNS(svgNS, "polygon");
                arrowHead.setAttribute("class", "diag-head");
                arrowHead.setAttribute("points", "70,18 80,18 75,25");

                svg.appendChild(path);
                svg.appendChild(arrowHead);
                wrapper.appendChild(svg);
            }

            container.appendChild(wrapper);
        });
    }

    // Generate the paths dynamically
    const gateEntryPath = ["Day to Day Transactions", "Stores", "Receipt(Item)", "Gate Entry IN", "Vendor"];
    buildDiagonalPath('path-gate-entry', gateEntryPath);

    const stockAdjPath = ["Stores", "Issue (Item)", "General"];
    buildDiagonalPath('path-stock-adj', stockAdjPath);

    const issueItemPath = ["Stores", "Issue Item", "Production", "Warehouse", "Requisition & Consumption"];
    buildDiagonalPath('issue-item', issueItemPath);

    const logSheetPath = ["Day to Day Transactions", "Project (WBS)", "Resource Utilization"];
    buildDiagonalPath('Log-Sheet', logSheetPath);

    const purchaseOrderPath = ["Day to Day Transactions", "Purchase + VRM", "Order/Amendment/Schedule", "Order"];
    buildDiagonalPath('Purchase-Order', purchaseOrderPath);

    const purchaseRequisitionPath = ["Day to Day Transactions", "Purchase + VRM", "Indent"];
    buildDiagonalPath('Purchase-Requisition', purchaseRequisitionPath);

    const grnPath = ["Day to Day Transactions", "Stores", "Receipt(Item)", "Party (DC)/GIN", "Goods/Material Receipt Note"];
    buildDiagonalPath('GRN', grnPath);

    const purchaseBillPath = ["Day to Day Transactions", "Purchase + VRM", "Receipt Bill", "Party"];
    buildDiagonalPath('Purchase-Bill', purchaseBillPath);

    const jvPath = ["Day to Day Transactions", "Accounts(G/L)", "Journal(JVs)", "Local"];
    buildDiagonalPath('JV', jvPath);

    const deliveryChallanPath = ["Day to Day Transactions", "Transfer - (Item)", "Intra", "W -> W", "Remote Transfer to Transit"];
    buildDiagonalPath('Delivery-Challan', deliveryChallanPath);

    const deleteDNPath = ["Day to Day Transactions", "Accounts(G/L)", "Purchase", "Debit Note/Credit Note"];
    buildDiagonalPath('Delete-Debit-Note-Credit-Note', deleteDNPath);

    const expenseEntryPath = ["Day to Day Transactions", "Accounts(G/L)", "Purchase", "Credit"];
    buildDiagonalPath('Expense-Entry', expenseEntryPath);

    const poAmendmentPath = ["Day to Day Transactions", "Purchase + VRM", "Order/Amendment/Schedule", "Amendment", "Single PO"];
    buildDiagonalPath('PO-Amendment', poAmendmentPath);

    const approvalFlowPath = ["Masters+Controls+Configuration", "Admin/MIS", "Authorization(Master + Tranaction)", "Multilevel Conditional", "Transactional Work Flow", "Always"];
    buildDiagonalPath('Approval-Flow', approvalFlowPath);

    const changeUserPasswordPath = ["Masters+Controls+Configuration", "Admin/MIS", "Role Rights", "Assignment (to users) + View", "User ID & Mod"];
    buildDiagonalPath('Change-User-Password', changeUserPasswordPath);

    const binCreatePath = ["Masters+Controls+Configuration", "Masters", "Location of Enterprise", "Internal", "Bin (Sub)"];
    buildDiagonalPath('Bin-Create', binCreatePath);

    const binAddPath = ["Masters+Controls+Configuration", "Masters", "Location of Enterprise", "Internal", "Bin (Sub)", "Select Location -> Add -> Code = Common", "Description = Any", "Asset code = XXXXXXX", "Save"];
    buildDiagonalPath('Bin-Add', binAddPath);

    const itemTagPath = ["Masters+Controls+Configuration", "Masters", "Item + Fixed Assets", "Item", "Select Group (Item Spare(V), Trading, Power & Fuel)", "Search item code -> Modify -> click Add(Line Item) -> Add(Location) -> C-Hook -> Quit(Save)"];
    buildDiagonalPath('Item-Tag', itemTagPath);

    const addEmployeePath = ["Masters+Controls+Configuration", "Masters", "Party", "E-Employee", "EMP Code -> Name -> Address -> Save"];
    buildDiagonalPath('Add-Employee', addEmployeePath);

    const stockReportProcessPath = ["Reports", "Inventory", "Status/Ledger Reports", "Inventory Status(Period)", "Accepted Quantity (Optimized-Beta Version)", "Summary"];
    buildDiagonalPath('Stock-Report-Process', stockReportProcessPath);

    const binWiseStockReportPath = ["Reports", "User Defined", "Local", "Bin Wise Quantity & Value", "Summary"];
    buildDiagonalPath('Bin-Wise-Stock-Report', binWiseStockReportPath);

    const consumptionReportPath = ["Reports", "Inventory", "Other Inv. Reports", "Ccpcwise Consumption Statement", "Intermediate Level", "Div.Level -> (6)", "Asset (Select All/CTRL+A)"];
    buildDiagonalPath('Consumption-Report', consumptionReportPath);

    const pendingApprovalsPath = ["Overall Drill Down Query", "Audit", "Workflow", "TICK - Transaction Details", "TICK - Specific Doc Types", "Unauthorised", "continue"];
    buildDiagonalPath('Pending-Approvals', pendingApprovalsPath);

    const shortOpenPath = ["Overall Drill Down Query", "Purchase", "Indent status - open", "All(select)", "Search", "Write->Remark", "save"];
    buildDiagonalPath('Short-Open', shortOpenPath);

    const shortClosePath = ["Overall Drill Down Query", "Purchase", "Indent status - close", "All(select)", "Search ", "Next Arrow", "Select Line Item", "save"];
    buildDiagonalPath('Short-Close', shortClosePath);

    const excelTag = ["EID IN/OUT (Excel/xBase/Text)", "EID IN/OUT", "EID In(Excel/xBase/Text)", "Masters/Control", "Item", "Tag Additional Location", "Tag excel file"];
    buildDiagonalPath('Excel-Tag', excelTag);

    const townCodePath = ["Masters+Controls+Configuration", "Distribution", "Geographical Hierarchy", "Town", "Add", "save"];
    buildDiagonalPath('Town-Code', townCodePath);

    const hsnGstPath = ["Masters+Controls+Configuration", "Pur+Sale", "GST/Custom Tariff (HSN/SAC xDate)", "Search/Add"];
    buildDiagonalPath('HSN-GST', hsnGstPath);



    const error2 = ["select * from maitemh where im_code = '------'", "update maitemh set im_refpric = '1' where im_code = '------'"];
    buildDiagonalPath('error-path-2', error2);

    // --- Error Resolution Paths ---
    const error1 = [
        "Masters+Controls+Configuration",
        "Masters",
        "Locations of Enterprise",
        "Internal",
        "Main",
        "Search Location",
        "Modify",
        "Remote Loc-Information",
        "Compare/Update GST"
    ];
    buildDiagonalPath('error-path-1', error1);

    // Note: You do not need a JS path for Error 2 anymore, 
    // because the global copy-sql buttons script will automatically handle the copy button!




    // Critical fix: Re-capture nodes into searchTargets AFTER JS builds them dynamically error-path-1

    // --- Copy Table Name to Clipboard ---
    const copyTableBtns = document.querySelectorAll('.copy-table-btn');
    copyTableBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Find the adjacent h3 tag and grab its text (ignoring the icon HTML)
            const tableNameEl = e.currentTarget.parentElement.querySelector('.table-name-title');
            const textToCopy = tableNameEl.textContent.trim();

            navigator.clipboard.writeText(textToCopy).then(() => {
                const icon = btn.querySelector('i');
                icon.classList.replace('fa-copy', 'fa-check');
                btn.style.color = 'var(--primary-color)';

                setTimeout(() => {
                    icon.classList.replace('fa-check', 'fa-copy');
                    btn.style.color = '';
                }, 1500);
            });
        });
    });



    document.querySelectorAll('.dynamic-node').forEach(node => {
        if (!node.dataset.originalHtml) {
            node.dataset.originalHtml = node.innerHTML;
        }
    });

});

// --- Theme Color Picker Logic ---
const htmlEl = document.documentElement;
const themeDots = document.querySelectorAll('.theme-dot');

// 1. Check local storage for a saved color, default to 'indigo'
const savedColor = localStorage.getItem('erp-color') || 'emerald';
htmlEl.setAttribute('data-color', savedColor);

// 2. Setup the dots
themeDots.forEach(dot => {
    // Make the saved color's dot "active" on load
    if (dot.getAttribute('data-color') === savedColor) {
        dot.classList.add('active');
    }

    // Listen for clicks on the dots
    dot.addEventListener('click', (e) => {
        // Remove 'active' ring from all dots
        themeDots.forEach(d => d.classList.remove('active'));

        // Add 'active' ring to the clicked dot
        e.target.classList.add('active');

        // Change the theme color and save it to the browser
        const color = e.target.getAttribute('data-color');
        htmlEl.setAttribute('data-color', color);
        localStorage.setItem('erp-color', color);
    });
});
