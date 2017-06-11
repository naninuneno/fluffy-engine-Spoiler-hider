chrome.runtime.sendMessage({method: "storage"}, function(response) {
  console.log("Got response");
  blurSpoilers(response.storage);
});

function blurSpoilers(storage) {
  var spoilerText = "Potential spoilers! Mouse over to view original";
  
  // TODO: make work for other elements
  var texts = document.getElementsByTagName('p');
  var potentialSpoilers = [];
  storage.forEach(function(storedShow) {
    storedShow.cast.forEach(function(characterName) {
      var names = characterName.split(" ");
      names.forEach(function(name) {
        // remove quotations from character nicknames
        if (name[0] = "'" && name[name.length -1] == "'") {
          name = name.substring(1, name.length - 1);
        }
        potentialSpoilers.push(name);
      });
    });
  });

  // TODO: case-insensitive comparison
  for (i = 0; i < texts.length; i++) {
    var originalText = texts[i].textContent;
    var isSpoiler = false;
    
    for (j = 0; j < potentialSpoilers.length; j++) {
      var spoiler = potentialSpoilers[j];
    
      // TODO: poor performance - alternative?
      var words = originalText.split(" ");
      
      for (k = 0; k < words.length; k++) {
        var word = words[k];
        
        if (word == spoiler) {
          texts[i].textContent = spoilerText;
          
          // closure for immediate execution
          (function (_originalText) {
            texts[i].addEventListener("mouseover", function(e) {
              e.target.textContent = _originalText;
            });
            
            texts[i].addEventListener("mouseout", function(e) {
              e.target.textContent = spoilerText;
            });
          })(originalText);
          
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
};