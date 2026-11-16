$(function() {
    console.log("JS V6 working");


    // Clean data
    $("select, input").val("");

    // Country select: searchable dropdown (Select2), keeps the underlying
    // <select class="country-input sel-code req"> as the source of truth
    // so .val() and the field-invalid/field-valid change handler below
    // keep working exactly as before.
    $(".country-input").select2({
        placeholder: "Select country",
        width: "100%",
        minimumResultsForSearch: 0
    });

    // Variables
    var tagOpt = $(".sel-code");
    $utmIn = $(".utmTxt");
    $year = $('#year').val();
    $month = $('#month').val();

    // Cleaner Previous Code
    $("#tagger,#utmGen").click(function() {
        $nodeClean = $(this).next().find(".white-square");
        $nodeClean.children("#finalCode").val("");
        $nodeClean.children("#finalCodeCont").contents().remove();
    });

    // ****** TAG GENERATOR FUNCTION ******
    $("#tagger").click(function() {
        $('input[name="finalTag"]').val("");
        // Validate data Function
        // mask cover the real input
        $noSelect = $(".req,.mask").filter(function() {
            return this.value == "";
        });
        $ans = $(".sel-code,.mask").filter(function() {
            return this.value != "";
        });
        if ($noSelect.length > 0) {
            $noSelect.addClass("field-invalid");
            alert(
                $noSelect.length +
                " mandatory field(s) remain to be filled. Please fill them to continue."
            );
            console.log($noSelect.length);
        } else {
            // Replace spaces Function
            $camp = $('[name="campName"]').val().replace(/ /g, "_");
            $('[name="campName"]').val($camp);
            $desc = $('[name="mailDesc"]').val().replace(/ /g, "_");
            $('[name="mailDesc"]').val($desc);
            // Generate Code Function
            for (var i = 0; i < tagOpt.length; i++) {
                var tagOptVal = $(tagOpt[i]).val();
                // Create the hidden code
                $codeHyde = $(this).next().find("#finalCodeCont");
                if (i != 9) {
                    $codeHyde.append(tagOptVal + "-");
                } else {
                    $codeHyde.append(tagOptVal);
                }
            }
            //set the hidden code as visible code input
            $textCode = $codeHyde.text().slice(0, -1);
            $codeBox = $(this).next().find("#finalCode");
            $codeBox.val($textCode);
            // auto-populated fields
            $("#utmContent").val($textCode);
            $("#utmCampaign:text").val($("#campName").val());
            $("#utmContent,#utmCampaign:text,#utmSource,#utmMedium").removeClass("field-invalid").addClass("field-valid");

            // Connects Source name with UTM-Source
            const utmSources = {
                'AE': 'utm_source=Owned-AE',
                'Banner': 'utm_source=Banner',
                'SFMC': 'utm_source=Owned-SFMC',
                'MURL': 'utm_source=MURL',
                'OURL': 'utm_source=OURL',
                'SM': 'utm_source=SM',
                '3rd': 'utm_source=Paid-3rd',
                'QR': 'utm_source=QR'
            };

            const source = $('#source').val();
            if (utmSources[source]) {
                $('#utmSource').val(utmSources[source]);
            }

            //Connects Activity with Medium

            const utmMediums = {
                'SM': 'utm_medium=SM',
                'BANNER': 'utm_medium=banner',
                'EXHIB': 'utm_medium=EXHIB',
                'LB': 'utm_medium=LB',
                'PR_ADV': 'utm_medium=PR_ADV'
            };

            const actType = $('#actType').val();
            $('#utmMedium').val(utmMediums[actType] || 'utm_medium=email');
        };
    });

    // ****** UTM GENERATOR FUNCTION ******
    $("#utmGen").click(function() {
        $('[name="finalUtm"]').val("");
        autoGrow($('[name="finalUtm"]'));
        // Select answered inputs
        $utmAns = $(".utmTxt").filter(function() {
            return this.value != "";
        });

        $noUtm = $(".utmTxt-req").filter(function() {
            return this.value == "";
        });
        if ($noUtm.length > 0) {
            $noUtm.addClass("field-invalid");
            alert(
                $noUtm.length +
                " mandatory field(s) remain to be filled. Please fill them to continue."
            );
        } else {
            // Generate UTM code

            for (h = 0; h < $utmAns.length; h++) {
                $utmAnsVal = $utmAns[h].value;
                // Create the hidden code
                $codeHyde = $(this).next().find("#finalCodeCont");
                if (h == 3) {
                    $codeHyde.append('utm_campaign=' + $utmAnsVal + '&');
                } else if (h == 4) {
                    $codeHyde.append('utm_content=' + $utmAnsVal + '&');
                } else if (h == 5) {
                    $target = $('[name="target"]').val().replace(/ /g, "_");
                    $('[name="target"]').val($target);
                    $codeHyde.append('utm_term=' + $target + '&');
                } else {
                    $codeHyde.append($utmAnsVal + '&');
                }
            }
            // conditional if '?' or not
            $textCode = $codeHyde.text().slice(0, -1).includes('?') ? $codeHyde.text().slice(0, -1) : $codeHyde.text().slice(0, -1).replace(/&/, '?');
            $codeBox = $(this).next().find("#finalCode");
            $codeBox.val($textCode);
            autoGrow($codeBox);
        }

    });

    // ****** FUNCTIONS COPYCODE ON CLIPBOARD & EDIT/CONFIRM CODE **********

    $(".edit-icon").click(function() {
        $(this).siblings(".bgCode").find("#finalCode").prop("readonly", false);
        $(this)
            .siblings(".bgCode")
            .find(".container-code")
            .css("border", "solid 2px skyblue");
        // Switch icons
        $(this).prev().hide();
        $(this).hide();
        $(this).next().show();
        // Create new code
        $codeHyde.contents().remove();
        $newCode = $codeBox.val();
    });

    $(".confirm-icon").click(function() {
        $(this).siblings(".bgCode").find("#finalCode").prop("readonly", true);
        $(this)
            .siblings(".bgCode")
            .find(".container-code")
            .css("border", "solid 2px #ff5000");
        // Switch Icons
        $(this).hide();
        $(this).prev().show();
        $(this).siblings(".copy-icon").show();
        // Create new code
        $newCode = $codeBox.val();
        $codeHyde.contents().remove();
        $codeHyde.append($newCode);
    });

    $(".confirm-icon-code").click(function() {
        // Pre-populate
        $("#utmContent").val("");
        $("#utmContent").val($newCode);
    });

    $(".copy-icon").click(function() {
        // Sync hidden field and visible input
        $textIn = $(this).siblings(".bgCode").find("#finalCode").val();
        $textHyd = $(this).siblings(".bgCode").find("#finalCode");
        // Copy the field's current value (works for both the input and the textarea)
        $selText = $textIn;

        function alertCopied() {
            alert(
                "Your code: " + "«" + $selText + "»" + " has been copied on clipboard"
            );
        }

        function legacyCopy() {
            $textHyd.select();
            document.execCommand("copy");
            alertCopied();
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText($selText).then(alertCopied, legacyCopy);
        } else {
            legacyCopy();
        }
    });

    // *****Highlight completed fields*********
    $('select,input,option').change(function() {
        $(this).removeClass("field-invalid").addClass("field-valid");
    })

    // HOVER FUNCTIONS
    $(".inf").hover(function() {
        $(this).next('.infobox').show(200)
    }, function() {
        $(this).next('.infobox').hide(200);

    });

});

// Date function
function setDate() {
    $year = $('#year').val();
    $month = $('#month').val()
    if ($year != null && $month != null) {
        $('input[name="date"]').val($year + $month);
    }
}

// Forbidden Characters Function
$('#campName,#mailDesc').change(function() {
    var campVal = $(this).val().replace(/\?/g, "");;
    //console.log(campVal);
    $(this).val(campVal);
})
// Resize the UTM textarea to fit its whole content
function autoGrow($el) {
    $el.filter("textarea").each(function() {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
    });
}
$(document).on("input", "textarea#finalCode", function() { autoGrow($(this)); });
$(window).on("resize", function() { autoGrow($("textarea#finalCode")); });
