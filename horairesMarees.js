exports.action = function(data, callback, config, SARAH){

  // Retrieve config
  config = config.modules.horairesMarees;
  
  if (!config.id || !config.day)
  {
    console.log("Missing maree config in prop file");
    callback({'tts' : 'configuration invalide'});
    return;
  }
  
  var url = "http://maree.info/"+config.id;
  var request = require('request');
  
  request({ 'uri' : url , json : true}, function (err, response, body)
  {
   
    if (err || response.statusCode != 200)
    {
      callback({'tts': "Je n'ai pas trouvé d'information"});
      return;
    }

    var day = config.day;
    if (data.day != null){
      day = data.day;
    }

    var tts = parse(body,day,config.id);
    callback({'tts' : tts});
  });
}

var parse = function(body, day,id)
{
  // --- Récupération du jour de la semaine ---
  var numDaySearch = false;
  
  if (day == 'lundi')         { numDaySearch = 1;}
  else if (day == 'mardi')    { numDaySearch = 2;}
  else if (day == 'mercredi') { numDaySearch = 3;}
  else if (day == 'jeudi')    { numDaySearch = 4;}
  else if (day == 'vendredi') { numDaySearch = 5;}
  else if (day == 'samedi')   { numDaySearch = 6;}
  else if (day == 'dimanche') { numDaySearch = 0;}

  var today = new Date();
  var numToday = today.getDay();
  
  var indexJour = 0; // index est égal au jour recherché dans la liste renvoyée par le json

  if (numDaySearch === false)
  {
    
    indexJour = day; // Dans ce cas, day est un entier (Aujourd'hui : 0), (demain : 1), (après-demain : 2)
  }
  else
  {
    if (numDaySearch >= numToday)
    {
      indexJour = numDaySearch - numToday;
    }
    else
    {
      indexJour = 7 - (numToday - numDaySearch);
    }
  }

 if (indexJour > 6)
  {
    var tts = "Je n'ai pas les horaires des marées ";
    return tts;
  }
 
    //recherche de la chaine de caracteres : MareeJours_
  var stringRecherche = "MareeJours_"+indexJour;
  var indexTrouve = body.indexOf(stringRecherche);

  //découpage de la chaine a partir de indexTrouve
  var subBody = body.substring(indexTrouve,indexTrouve+400);
  //dans subBody on cherche uniquement la partie données et non entete.
  var finLigne ="</th>";
  var indexFinligne = subBody.indexOf(finLigne);
  var subBodyDonnee = subBody.substring(indexFinligne+5);

  //recherche les horaires de marée haute sont encadré de <b> alors que les horaires de marée basse de le sont pas.
  //attention il y a un premier <b> pour le jour de la date.
  var bolt ="<b>";
  var indexBolt = subBodyDonnee.indexOf(bolt);

  var heureHaute1;
  var heureHaute2;
  var heureBasse1;
  var heureBasse2;

  
  var indexCoeff;
  if(indexBolt == 4) {
    //c est d'abord maree haute puis base puis haute , puis basse.
    heureHaute1 = subBodyDonnee.substring(7,12);
    heureBasse1 = subBodyDonnee.substring(20,25);
    heureHaute2 = subBodyDonnee.substring(32,37);
    heureBasse2 = subBodyDonnee.substring(45,50);
    
    //donc le coeff sera identifié par m</td><td><b>
    indexCoeff = subBodyDonnee.indexOf("m</td><td><b>") +13;

  }else{
    //c est d'abord maree base puis haute puis base puis haute
    heureBasse1 = subBodyDonnee.substring(4,9);
    heureHaute1 = subBodyDonnee.substring(16,21);
    heureBasse2 = subBodyDonnee.substring(29,34);
    heureHaute2 = subBodyDonnee.substring(41,46);

    indexCoeff = subBodyDonnee.indexOf("&nbsp;<br><b>")+13;
  }

  //recuperation des coeff de marée
  var subCoeff =  subBodyDonnee.substring(indexCoeff);
  var indexFinCoeff = subCoeff.indexOf("</b>");
  var coeff1 = subCoeff.substring(0,indexFinCoeff);
  var subCoeff2 = subCoeff.substring(indexFinCoeff+21);
  var indexFinCoeff2 = subCoeff2.indexOf("</b>");
  var coeff2 = subCoeff2.substring(0,indexFinCoeff2);

  //construction du retour
  var stringRetour = "Oui Monsieur . "; 
  if (numDaySearch == false){
    if (indexJour ==0){
      stringRetour+= "Aujourd hui";
    }
    else if (indexJour == 1){
      stringRetour+= "Demain";
    }
    else if (indexJour == 2){
      stringRetour+= "Après-demain";
    }
  }else {
    stringRetour+=day;
  }
  stringRetour += " la marée sera haute à " + heureHaute1;
  stringRetour += ", avec un coefficient de " + coeff1;
  stringRetour += " , puis à " +heureHaute2;
  stringRetour += ", avec un coefficient de " + coeff2;
  stringRetour += " . La marée sera basse à "+ heureBasse1;
  stringRetour += " , puis à " +heureBasse2;
return stringRetour;
}
