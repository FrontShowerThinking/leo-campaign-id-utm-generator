/* =====================================================================
   CAMPAIGN ID & UTM GENERATOR - LEO Pharma
   jQuery. Two independent blocks on the page:
     1. Campaign ID generator  -> result box #tagCode  (inside #tagBox)
     2. UTM link generator     -> result box #utmCode  (inside #utmBox)
   Each result block has its own copy / edit / confirm icons, and every
   handler works only on the block it was clicked in, so the two
   generators never read each other's values.
   ===================================================================== */

// ****** CONFIGURATION ******

// Connects Source name with UTM-Source
var UTM_SOURCES = {
    'AE': 'utm_source=Owned-AE',
    'Banner': 'utm_source=Banner',
    'SFMC': 'utm_source=Owned-SFMC',
    'MURL': 'utm_source=MURL',
    'OURL': 'utm_source=OURL',
    'SM': 'utm_source=SM',
    '3rd': 'utm_source=Paid-3rd',
    'QR': 'utm_source=QR'
};

// Connects Activity (Campaign Type) with Medium.
// Any activity not listed here is an email.
var UTM_MEDIUMS = {
    'SM': 'utm_medium=SM',
    'BANNER': 'utm_medium=banner',
    'EXHIB': 'utm_medium=EXHIB',
    'LB': 'utm_medium=LB',
    'PR_ADV': 'utm_medium=PR_ADV'
};
var UTM_MEDIUM_DEFAULT = 'utm_medium=email';

// Separator between the parts of the Campaign ID. A field can override the
// separator that follows it with data-sep (Content Category uses data-sep=""
// so it is joined to the CTA Category, e.g. 6 + 10 = "610").
var TAG_SEPARATOR = '-';

var MANDATORY_MSG = ' mandatory field(s) remain to be filled. Please fill them to continue.';


$(function() {

    // Clean data (browsers may keep values after a reload)
    $("select, input, textarea").val("");

    // Country select: searchable dropdown (Select2), keeps the underlying
    // <select class="country-input sel-code req"> as the source of truth
    // so .val() and the field-invalid/field-valid change handler below
    // keep working exactly as before.
    $(".country-input").select2({
        placeholder: "Select country",
        width: "100%",
        minimumResultsForSearch: 0
    });

    // Pressing Enter inside a text field must not submit (and reload) the page
    $("form").on("submit", function(e) {
        e.preventDefault();
    });


    // ****** SHARED HELPERS ******

    // Notices (toast): a small message at the bottom of the screen that
    // hides itself after a few seconds, instead of the blocking alert().
    // type: "success" (green) or "error" (red). The container is created
    // the first time it is needed; aria-live makes screen readers say it.
    var noticeTimer;
    function notify(message, type) {
        var $toast = $("#toast");
        if (!$toast.length) {
            $toast = $('<div id="toast" class="toast" role="status" aria-live="polite"></div>')
                .appendTo("body");
        }
        $toast
            .text(message)
            .removeClass("toast--success toast--error")
            .addClass("toast--" + (type || "success") + " is-visible");
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(function() {
            $toast.removeClass("is-visible");
        }, type == "error" ? 5000 : 3000);
    }

    // Required fields that are still empty get the red border and the
    // alert. Returns true when everything is filled in.
    function checkRequired($fields) {
        var $empty = $fields.filter(function() {
            return this.value == "";
        });
        if ($empty.length > 0) {
            $empty.addClass("field-invalid");
            notify($empty.length + MANDATORY_MSG, "error");
            return false;
        }
        return true;
    }

    // Spaces are not allowed in the codes: replace them with "_" and
    // write the cleaned value back into the field so the user sees it.
    function underscoreSpaces($field) {
        var clean = $field.val().replace(/ /g, "_");
        $field.val(clean);
        return clean;
    }

    // The result box (input or textarea) of the block an icon belongs to
    function resultBox(icon) {
        return $(icon).closest(".table-code").find(".container-code");
    }


    // ****** TAG GENERATOR FUNCTION (Campaign ID) ******
    $("#tagger").click(function() {
        var $codeBox = $("#tagCode");
        // Cleaner Previous Code
        $codeBox.val("");

        // Validate data: every .req field and the date selects (.mask covers
        // the real hidden date input) must have a value
        if (!checkRequired($(".req, .mask"))) {
            return;
        }

        // Replace spaces in the free-text fields
        var campName = underscoreSpaces($("#campName"));
        underscoreSpaces($("#mailDesc"));

        // Generate Code: every .sel-code field, in page order, joined with
        // "-" (or with the field's own data-sep)
        var code = "";
        var $parts = $(".sel-code");
        $parts.each(function(i) {
            var isLast = (i == $parts.length - 1);
            var sep = $(this).data("sep");
            code += $(this).val();
            if (!isLast) {
                code += (sep === undefined ? TAG_SEPARATOR : sep);
            }
        });
        $codeBox.val(code);

        // auto-populated fields of the UTM generator
        $("#utmContent").val(code);
        $("#utmCampaign").val(campName);

        var source = $("#source").val();
        if (UTM_SOURCES[source]) {
            $("#utmSource").val(UTM_SOURCES[source]);
        }
        $("#utmMedium").val(UTM_MEDIUMS[$("#actType").val()] || UTM_MEDIUM_DEFAULT);

        $("#utmContent, #utmCampaign, #utmSource, #utmMedium")
            .removeClass("field-invalid")
            .addClass("field-valid");
    });


    // ****** UTM GENERATOR FUNCTION ******
    $("#utmGen").click(function() {
        var $codeBox = $("#utmCode");
        // Cleaner Previous Code
        $codeBox.val("");
        autoGrow($codeBox);

        if (!checkRequired($(".utmTxt-req"))) {
            return;
        }

        // Term is free text: no spaces allowed
        underscoreSpaces($("#utmTarget"));

        // Collect "key=value" pairs from every filled UTM field (data-key
        // says which parameter each one is). Source and Medium already come
        // as "utm_source=..." / "utm_medium=..."; the rest are encoded so a
        // "&", "#" or "=" typed by the user can't break the link.
        var link = "";
        var params = [];
        $(".utmTxt").each(function() {
            var key = $(this).data("key");
            var val = $(this).val();
            if (val == "") {
                return; // optional field left empty (Term)
            }
            if (key == "link") {
                link = val;
            } else if (val.indexOf(key + "=") === 0) {
                params.push(val);
            } else {
                params.push(key + "=" + encodeURIComponent(val));
            }
        });

        // The query goes before any "#anchor" of the link, otherwise
        // Analytics can't read it. Use "&" if the link already has a "?".
        var hash = "";
        var hashPos = link.indexOf("#");
        if (hashPos > -1) {
            hash = link.slice(hashPos);
            link = link.slice(0, hashPos);
        }
        var joiner = link.indexOf("?") > -1 ? "&" : "?";

        $codeBox.val(link + joiner + params.join("&") + hash);
        autoGrow($codeBox);
    });


    // ****** FUNCTIONS COPYCODE ON CLIPBOARD & EDIT/CONFIRM CODE **********

    // Edit: make the result box writable and swap copy/edit for confirm
    $(".edit-icon").click(function() {
        resultBox(this)
            .prop("readonly", false)
            .removeClass("is-confirmed")
            .addClass("is-editing");
        // Switch icons
        $(this).prev().hide();
        $(this).hide();
        $(this).next().show();
    });

    // Confirm: lock the box again and bring the icons back
    $(".confirm-icon").click(function() {
        var $box = resultBox(this);
        $box
            .prop("readonly", true)
            .removeClass("is-editing")
            .addClass("is-confirmed");
        // Switch Icons
        $(this).hide();
        $(this).prev().show();
        $(this).siblings(".copy-icon").show();
        // An edited Campaign ID also becomes the UTM Content ID
        if ($(this).hasClass("confirm-icon-code")) {
            $("#utmContent").val($box.val());
        }
    });

    // Copy the current value of the block's result box
    $(".copy-icon").click(function() {
        var $box = resultBox(this);
        var text = $box.val();

        function noticeCopied() {
            notify("Copied to clipboard: " + text, "success");
        }

        // Older browsers: select the box and use the old copy command
        function legacyCopy() {
            $box.select();
            document.execCommand("copy");
            noticeCopied();
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(noticeCopied, legacyCopy);
        } else {
            legacyCopy();
        }
    });


    // ****** FIELD HELPERS ******

    // Date: year + month selects fill the hidden "date" field (YYYYMM)
    $("#year, #month").change(function() {
        var year = $("#year").val();
        var month = $("#month").val();
        if (year != null && month != null) {
            $('input[name="date"]').val(year + month);
        }
    });

    // Forbidden Characters: "?" would break the UTM link
    $("#campName, #mailDesc").change(function() {
        $(this).val($(this).val().replace(/\?/g, ""));
    });

    // Highlight completed fields
    $("select, input").change(function() {
        $(this).removeClass("field-invalid").addClass("field-valid");
    });

    // HOVER FUNCTIONS: info boxes next to the labels
    $(".inf").hover(function() {
        $(this).next(".infobox").show(200);
    }, function() {
        $(this).next(".infobox").hide(200);
    });

    // The UTM textarea grows with what the user types while editing,
    // and when the window width changes
    $("#utmCode").on("input", function() {
        autoGrow($(this));
    });
    $(window).on("resize", function() {
        autoGrow($("#utmCode"));
    });
});


// Resize the UTM textarea to fit its whole content
function autoGrow($el) {
    $el.filter("textarea").each(function() {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
    });
}
