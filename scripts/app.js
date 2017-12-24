// Copyright 2016 Google Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


(function() {
  'use strict';

  var app = {
    data:{},
    isLoading: true,
    visibleCards: {},
    selectedCities: [],
    masterData: {},
    intro: true,
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    unchosen: document.querySelector('.unchosen'),
    team1: document.querySelector('.team1'),
    team2: document.querySelector('.team2'),
    team3: document.querySelector('.team3'),
    team4: document.querySelector('.team4'),
    teamCards: [
    document.querySelector('.unchosen'),
    document.querySelector('.team1'),
    document.querySelector('.team2'),
    document.querySelector('.team3'),
    document.querySelector('.team4')
    ],
    myTeam: 1,
    up: true,
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container'),
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  };


  /***************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  document.getElementById('butRefresh').addEventListener('click', function() {
    // Refresh all of the forecasts
    app.updateForecasts();
  });

  document.getElementById('butAdd').addEventListener('click', function() {
    // Open/show the add new city dialog
    app.toggleAddDialog(true);
  });

  document.getElementById('butAddCancel').addEventListener('click', function() {
    // Close the add new city dialog
    app.toggleAddDialog(false);
  });

  document.getElementById('introButton').addEventListener('click', function() {
    // Clear Opening Intro Box
    app.setName();
  });


  /***************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  /*
   * Gets a forecast for a specific city and updates the card with the data.
   * getForecast() first checks if the weather data is in the cache. If so,
   * then it gets that data and populates the card with the cached data.
   * Then, getForecast() goes to the network for fresh data. If the network
   * request goes through, then the card gets updated a second time with the
   * freshest data.
   */
  app.getForecast = function(key, label) {
    var statement = 'select * from weather.forecast where woeid=' + key;
    var url = 'https://query.yahooapis.com/v1/public/yql?format=json&q=' +
        statement;
    // TODO add cache logic here

    // Fetch the latest data.
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          var results = response.query.results;
          results.key = key;
          results.label = label;
          results.created = response.query.created;
          app.updateForecastCard(results);
        }
      } else {
        // Return the initial weather forecast since no data is available.
        app.updateForecastCard(initialWeatherForecast);
      }
    };
    request.open('GET', url);
    request.send();
  };

  app.draftCard = function(thisCard) {
    var cardObj = thisCard.cloneNode(true)
    app.teamCards[app.myTeam].appendChild(cardObj)
    if (app.up && app.myTeam<4)
        app.myTeam++
    else if (!app.up && app.myTeam>1)
        app.myTeam--
    else if (app.myTeam >= 4)
        app.up=false
    else
        app.up=true

    app.unchosen.removeChild(thisCard)
  }

  app.setName = function() {
    app.user = document.getElementById('name').value
    document.getElementById('introPanel').classList.add("hidden");
    document.getElementById('mainPanel').classList.remove("hidden");
    document.getElementById('mainPanel').classList.add("visible");

  }

  app.updateColumns = function() {
    var cards = app.teamCards
    var teamNames = []
    addMissingTitles()
    
    cards.forEach(function (card){ //For each team
      if (card.childNodes.length > 1)
        var relevantData = app.data[card.childNodes[1].innerText]
      else
        var relevantData = []

      var players  = card.getElementsByClassName('card')

      //First remove cards not in dataset
      for (var i=0; i<players.length; i++){ //For each card in a given team
        var match = false
        for (var j=0; j<relevantData.length; j++){ //For each team member in the dataset
          if (players[i].textContent.trim() == relevantData[j].trim()){
            match=true
          }
        }
        if (!match){ //If the team has a member card not in the dataset, remove it
          card.removeChild(card.childNodes[i])
        }
      }

      //Then add missing cards from dataset
      for (var i=0; i<relevantData.length; i++){ //For each team member in the dataset
        var match = false
        for (var j=0; j<players.length; j++){ //For each card in a given team
          if (relevantData[i].trim() == players[j].textContent.trim()){
            match=true
          }
        }
        if (!match){ //If the dataset has a team member without a card, add one
          card.appendChild(textToCard(relevantData[i]))
        }
      }

    });
  }

  app.populateColumns = function(data) {
    var card
    var teamCount=0
    var teams = Object.keys(data)
    var cards = app.teamCards
    app.data = data

    teams.forEach(function(team)
    {
      if (teamCount == 5)
        alert("Too many teams!")
      
      var teamCard = cards[teamCount]
      teamCard.appendChild(titleTextToNode(team)); //Add title

      data[team].forEach(function(teamMember){
        if (teamCount>0)
          teamCard.appendChild(textToCard(teamMember)) //Add each player
        else
          teamCard.appendChild(unchosenTextToCard(teamMember)) //Add each player
      });
      
      teamCount+=1      
    });

    if (app.isLoading) {
    app.spinner.setAttribute('hidden', true);
    app.container.removeAttribute('hidden');
    app.isLoading = false;
  }
  }

  function titleTextToNode(txt){
    var titleNode = document.createElement("h3");
    var titleText = document.createTextNode(txt);
    titleNode.appendChild(titleText);
    return titleNode
  }

  function textToCard(txt){
    var card=app.cardTemplate.cloneNode(true);
    card.classList.remove('cardTemplate');
    card.removeAttribute('hidden');
    card.appendChild(document.createTextNode(txt));
    card.appendChild(document.createElement("br"));
    return card
  }

  function unchosenTextToCard(txt){
    var card=app.cardTemplate.cloneNode(true);
    card.classList.remove('unchosenCardTemplate');
    card.removeAttribute('hidden');
    card.appendChild(document.createTextNode(txt));
    card.appendChild(document.createElement("br"));
    console.log(card)
    card.addEventListener('click', function() {
      // Draft player to your team
      app.draftCard(this);
    });
    return card
  }

  function addMissingTitles(){
    var emptyCards=[]
    var teamNames = []
    app.teamCards.forEach(function(card){
      if (card.childNodes.length > 1)
        teamNames.push(card.childNodes[1].innerText) // Get all teamnames
      else
        emptyCards.push(card) //Get all empty cards
    });


    Object.entries(app.data).forEach(function(teamName){
      teamName = teamName[0]
      if (teamNames.indexOf(teamName) < 0){ //If a team name from the data set is not in a card
        emptyCards.shift().appendChild(titleTextToNode(teamName)) //add that team name to the first empty card
      }
    });
  }

  function getMyTeam(){
    var resultCard = null

    app.teamCards.forEach(function(card){
      if (card.childNodes.length > 1 && app.user == card.childNodes[1].innerText){
        resultCard = card
      }
    });

    if (resultCard)
      return resultCard
    else
      alert("ERROR!")
  }  

  /*
   * Fake weather data that is presented when the user first uses the app,
   * or when the user has not saved any cities. See startup code for more
   * discussion.
   */
  var sampleData = {
    unchosen: [
      "Giovanni  Recine",
      "Samuel  Whang",
      "Matthew Richardson",
      "Pranav  Laxman",
      "Alex  Lader",
      "Jeffrey Wilson",
      "Dylan Cohen",
      "Ryan  Darling",
      "Dylan Angel",
      "Neel  Jagad",
      "Liam  Ossenfort",
      "Nicholas  Sica",
      "David Tercho",
      "Edward  Aryee",
      "Camden  Marchetti",
      "Jakob Long",
      "Peirce  Law",
      "Cameron Calv",
      "Gabe  Collins",
      "Allan Michel",
      "John  Mazeika",
      "Michael Illanovsky",
      "Josh  Simon",
      "Agurami Agbeyegbe",
      "Nikhil  Judge",
      "Kyle  Matthews",
      "Ryan  Garvey",
      "Matthew Griffin",
      "William Reiner",
      "Michael Kyriazis",
      "Garhett Moore",
      "Christopher Postupack",
      "Erik  Skagestad",
      "Stephen Young",
      "Matt  Ashton",
      "Kent  Hubert",
      "Edgar Cardenas",
      "Pledge Adam",
      "Pledge Nico",
      "Pledge Tyler",
      "Pledge Mike",
      "Pledge Pat",
      "Pledge Liam",
      "Pledge Russel",
      "Pledge Spencer"
    ],
    BaksTeam: [
    ],
    SBsTeam: [
    ],
    RobsTeam: [
    ],
    BrycesTeam: [
    ]
  };

   app.populateColumns(sampleData);
})();﻿
