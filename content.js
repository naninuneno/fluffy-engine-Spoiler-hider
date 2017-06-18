chrome.runtime.sendMessage({method: "storage"}, function(response) {
  console.log("Got response");
  blurSpoilers(response.storage);
});

// TODO: has a 4-nested for loop, disgusting
function blurSpoilers(storage) {
  var spoilerTextTemplate = "Potential spoilers for {0}! Mouse over to view original";
  var spoilerSetClass = "spoiler-set"
  
  // TODO: make work for other elements
  // find elements that haven't already had spoiler set
  var texts = document.querySelectorAll('p:not(.' + spoilerSetClass + ')');
  
  // for each group
  for (i = 0; i < storage.length; i++) {
    var potentialSpoilers = [];
    var storedGroup = storage[i];
    if (!storedGroup.enabled) {
      continue;
    }
    
    // custom spoiler text for the group for some clarity
    var spoilerText = spoilerTextTemplate.format(storedGroup.name);
    
    storedGroup.spoilers.forEach(function(spoiler) {
      spoiler.spoilerFragments.forEach(function(fragment) {
        if (fragment.enabled) {
          // for case-insensitive comparison
          potentialSpoilers.push(fragment.text.toUpperCase());
        }
      });
    });
  

    // TODO: poor performance - alternative?
    // TODO: slow to start - waits for page to load
    // TODO: doesn't handle new content after page already loaded e.g. new reddit page in RES
    // for each text on page
    for (j = 0; j < texts.length; j++) {
      // innerHTML rather than textContent so that links etc. are preserved
      var originalHtml = texts[j].innerHTML;
      var isSpoiler = false;
      // for case-insensitive comparison
      var elementText = texts[j].textContent.toUpperCase();
      // remove common concatenations to the target (possessive, /(another name))
      elementText = elementText.replace(/'s|'S|\/[^ ]*/g, '');

      // for each potential spoiler text word (e.g. each word of spoiler name)
      for (k = 0; k < potentialSpoilers.length; k++) {
        var spoiler = potentialSpoilers[k];

        var words = elementText.split(" ");
        
        // for each word in page text element e.g. inside <p>
        for (l = 0; l < words.length; l++) {

          if (words[l] == spoiler) {
            // TODO: something here about retaining element height? so it's not so jarring to switch between spoiler and hover-over mode
            texts[j].textContent = spoilerText;
            texts[j].className += ' ' + spoilerSetClass;

            // closure for immediate execution
            (function (_originalHtml) {
              texts[j].addEventListener("mouseenter", function(e) {
                e.target.innerHTML = _originalHtml;
              });

              texts[j].addEventListener("mouseleave", function(e) {
                e.target.textContent = spoilerText;
              });
            })(originalHtml);

            isSpoiler = true;
            break;
          }
        }

        // already found spoiler candidate - return to continue on
        if (isSpoiler) {
          break;
        }
      }
    }
  }
};

// lifted from https://stackoverflow.com/questions/18405736/is-there-a-c-sharp-string-format-equivalent-in-javascript
// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}