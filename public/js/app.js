/* App Module */
var gruntApp = angular.module('gruntApp', ['ngRoute', 'gruntControllers']);


//BIG GLOBAL
var fund_value = 0;
var commission_rate = 0.05;


gruntApp.config(['$routeProvider',
  function($routeProvider){
    $routeProvider.
      when('/logIn',{
        templateUrl: 'partials/logIn.html',
        controller: 'logInCtrl'
      }).
      when('/grunts',{
        templateUrl: 'partials/grunts.html',
        controller: 'gruntCtrl'
      }).
      when('/grunts/:gruntFullName',{
        templateUrl: 'partials/gruntDetails.html',
        controller: 'gruntCtrl'
      }).
      when('/history',{
        templateUrl: 'partials/history.html',
        controller: 'historyCtrl'
      }).
      when('/settings',{
        templateUrl: 'partials/settings.html',
        controller: 'settingsCtrl'
      }).
      otherwise({
        redirectTo: '/logIn'
      });
  }
]);

gruntApp.config(function($compileProvider){
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|javascript):/);
});


/* Controllers */
var gruntControllers = angular.module('gruntControllers', []);

gruntControllers.controller("logInCtrl", function($scope){
  $('.navbarHidden').hide();
  $('#logIn').click(function(){
    $('.navbarHidden').show();
  });
});

gruntControllers.controller("gruntCtrl", ['$scope', '$routeParams', '$http', function($scope, $routeParams, $http){
  // $scope.grunts = [
  //   {'firstName': 'Dustin', 'fullName': 'Dustin Williams', 'value': 48},
  //   {'firstName': 'Luigi', 'fullName': 'Luigi Squillante', 'value': 19},
  //   {'firstName': 'Waseem', 'fullName': 'Waseem Quamar', 'value': 11},
  //   {'firstName': 'Zeke', 'fullName': 'Zeke Dean', 'value': 20},
  //   {'firstName': 'Bryan', 'fullName': 'Bryan Kimmons', 'value': 2}
  // ];
  

  //objects must be sent to the server in a post data string format
  // 'maths' is the default query, the options are
  //  'grunt' to get all grunts
  //  'cash'  to get all cash contributions
  //  etc for now

  var filter = "designDocID="+"maths"+"&viewName=newView";
  $scope.grunts            = new Array();
  $scope.grunts_historical = {};
  $scope.grunts_byName     = {};
  // the noflo API has to be queried in a very specific format or it will break
  var dataSet = $http({
    method:'POST',
    //url to get general views
    url:"http://localhost:1337/getViews", 
    data:filter,
    // data has to be form encoded
    headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'*/*'}
  }).success( function(data){
    var dataParsed = data;
    console.log(dataParsed.rows);
    for(var i = 0; i < dataParsed.rows.length; i++){
      // this retrieves the grunt's name from the database
      var name = dataParsed.rows[i].value.name || dataParsed.rows[i].value.fullName;
      // get all data from the backend grouped by name
      if ( _.has($scope.grunts_historical, name) ){
        $scope.grunts_historical[name].push(dataParsed.rows[i].value);
      }else{
        $scope.grunts_historical[name] = new Array();
        $scope.grunts_historical[name].push(dataParsed.rows[i].value);
      }

    }
    var grunt_data = {};


    // now step through all the people and make the totals object
    for (var grunt_name in $scope.grunts_historical) {
      var grunt = $scope.grunts_historical[grunt_name];
      //the object containing all of the totals is below
      var totals                                      = {};
      totals.grunt                                    = {};
        totals.grunt.marketSalary                     = 0;
        totals.grunt.cashCompensation                 = 0;
        totals.grunt.startDate                        = 0;
        totals.grunt.hourly                           = 0;
      totals.time                                     = {};
        totals.time.hours                             = 0;
        totals.time.rate                              = 0;
      totals.cash                                     = {};
        totals.cash.amount                            = 0;
        totals.cash.minorWorkingCapital               = 0;
        totals.cash.unreimbursedExpenses              = 0;
        totals.cash.purchasedForCompany               = 0;
      totals.equipment                                = {};
        totals.equipment.amount                       = 0;
        totals.equipment.category                     = {};
        totals.equipment.lessThanYear                 = 0;
        totals.equipment.moreThanYear                 = 0;
      totals.intellectual_property                    = {};
        totals.intellectual_property.developmentHours = 0;
        totals.intellectual_property.legalFees        = 0;
        totals.intellectual_property.otherCosts       = 0;
        totals.intellectual_property.unpaidRoyalties  = 0;
      totals.commissions                              = {};
        totals.commissions.saleValue                  = 0;
        totals.commissions.commissionEarned           = 0;
        totals.commissions.commission_rate            = commission_rate;
      totals.value                                    = 0;
      // now step through all of the grunt data
      // and insert into the total values object
      for(var i = 0; i < grunt.length; i++){
        var entry = grunt[i];
            //console.log(entry);
            switch(entry.type){
                //these are the special cases for each entry type
                // all values are summed for now
                case 'grunt':
                  totals.firstName = entry.firstName;
                  totals.fullName  = entry.fullName;
                  totals.grunt.marketSalary                     = Number(entry.marketSalary);
                  totals.grunt.cashCompensation                 = Number(entry.cashCompensation);
                  totals.grunt.startDate                        = Number(entry.startDate);
                  totals.time.rate                              = Number(entry.marketSalary)/100;
                  break;
                case 'time':
                  totals.time.hours                             += Number(entry.hours);
                  break;
                case 'cash':
                  totals.cash.amount                            += Number(entry.amount);
                  // break down for special categories
                  if(entry.minorWorkingCapital){
                    totals.cash.minorWorkingCapital             += Number(entry.amount);
                  }else if(entry.unreimbursedExpenses){
                    totals.cash.unreimbursedExpenses            += Number(entry.amount);
                  }else if(entry.purchasedForCompany){
                    totals.cash.purchasedForCompany             += Number(entry.amount);
                  }                             
                  break;
                case 'equipment':
                  totals.equipment.amount                       += Number(entry.amount);
                  // more special case for sub categories
                  if(entry.lessThanYear){
                    totals.equipment.lessThanYear               += Number(entry.amount);
                  }else if(entry.moreThanYear){
                    totals.equipment.moreThanYear               += Number(entry.amount);
                  } 
                  break;
                case 'intellectual_property':
                  totals.intellectual_property.developmentHours += Number(entry.developmentHours);
                  totals.intellectual_property.legalFees        += Number(entry.legalFees);
                  totals.intellectual_property.otherCosts       += Number(entry.otherCosts);
                  totals.intellectual_property.unpaidRoyalties  += Number(entry.unpaidRoyalties);
                  break;
                case 'commissions':
                  totals.commissions.saleValue                  += Number(entry.saleValue);
                  totals.commissions.commissionEarned           += Number(entry.commissionEarned)
                  break;
              }
      }
      // now calculate the total value

      // time value of money
      var tTime      = totals.time.hours  * totals.time.rate;
      totals["Time"] = tTime;
      // total cash contributions * 4
      var tCash      = totals.cash.amount * 4;
      totals["Cash"] = tCash;
      // depreciated value of equipment
      var tEquipment = totals.equipment.amount;
      totals["Equipment"] = tEquipment;
      // (development hours * hourly rate) + legal fees + other costs + (unpaid royalties * 2)
      var tIntellectual_Property = (totals.intellectual_property.developmentHours*totals.time.rate) + totals.intellectual_property.legalFees + totals.intellectual_property.otherCosts + ( totals.intellectual_property.unpaidRoyalties * 2)
      totals["Intellectual Property"] = tIntellectual_Property;
      // commissions = (sales revenue * 5%) - commission earned
      var tCommissions = (totals.commissions.saleValue * commission_rate) - totals.commissions.commissionEarned;
      totals["Commissions"] = tCommissions;
      // now sum total value for grunt
      //totals.value = tTime + tCash + tEquipment + tIntellectual_Property;
      totals.total_contribution = tTime + tCash + tEquipment + tIntellectual_Property;

      //set the grunt name to the total calculated contribution for that grunt
      grunt_data[grunt_name] = totals;
      //$scope.grunts.push(totals);

      //also store it in the historical data as well
      grunt.push(totals);
    }
    fund_value = 0;
    //get total value of the fund
    for (var gr in grunt_data){
      fund_value += grunt_data[gr].total_contribution;
      console.log(fund_value);
    }
    console.log();
    //now calculate everyone's indivudal contribution
    // contribution / fund value * 100
    for (var gr in grunt_data){
      // handle special case for 0 contribution
      if (grunt_data[gr].total_contribution <= 0){
        grunt_data[gr].value = 0; 
      }else{  
        grunt_data[gr].value =  parseInt( ( grunt_data[gr].total_contribution / fund_value )*100 );        
      }
      $scope.grunts_byName[gr] = grunt_data[gr];
      //now add the data to grunts array
      $scope.grunts.push(grunt_data[gr]);
    }
    $scope.fund_value = fund_value;



    //$scope.totals = grunt_data;

    console.log($scope.grunts);

  }); 




  $scope.primaryCategories = [
    {'category': 'Time', 'id': 'time', 'subCategories': [{'category': 'Hours', "id":"hours"}]},
    {'category': 'Cash', 'id': 'cash', 'subCategories': [{'category': 'Minor Working Capital', 'id':'minorWorkingCapital'}, {'category': 'Unreimbursed Expenses','id':'unreimbursedExpenses'}, {'category': 'Purchased for Company', 'id':'purchasedForCompany'}]},
    {'category': 'Equipment', 'id': 'equipment', 'subCategories': [{'category': 'Less than 1 year (Cost)','id':'lessThanYear'}, {'category': 'More than 1 year (Value)','id':'moreThanYear'}]},
    {'category': 'Intellectual Property', 'id': 'intellectual_property', 'subCategories': [{'category': 'Development Hours', 'id':'developmentHours'}, {'category': 'Legal Fees','id':'legalFees'}, {'category': 'Prototype Costs','id':'otherCosts'}, {'category': 'Other Costs'}, {'category': 'Unpaid Royalties','id':'unpaidRoyalties'}]},
    {'category': 'Commissions', 'id': 'commissions', 'subCategories': [{'category': 'Sales Revenue','id':'saleValue'}, {'category': 'Commission Paid', 'id':'commissionEarned'}]}
  ];
  $scope.gruntFullName = $routeParams.gruntFullName;
  $scope.orderPercentage = 'value';
  $scope.orderName = 'firstName';

  $scope.init = function(){  
    var fundData = $scope.grunts;
    nv.addGraph(function(){
      var fundChart = nv.models.pieChart()
        .x(function(d) { return d.firstName })
        .y(function(d) { return d.value })
        .color(['#153450', '#294052', '#447294', '#8FBCDB', '#CCCCCC'])
        .showLegend(false)
        .showLabels(true);
        d3.select("#fundChart svg")
          .datum(fundData)
          .transition().duration(500)
          .call(fundChart);
        nv.utils.windowResize(function(){ fundChart.update(); });
      return fundChart;
    });
  }
  $scope.init();

  $('.navbar-collapse a:not(.dropdown-toggle)').click(function(){
    if($(window).width() < 768 )
      $('.navbar-collapse').collapse('hide');
  });

  var timeToggle = cashToggle = equipmentToggle = intellectual_propertyToggle = commissionsToggle = 0;
  $scope.toggleCategory = function(categoryId){
    var tempToggle;
    switch(categoryId){
      case 'time':
        tempToggle = timeToggle;
        timeToggle++;
        break;
      case 'cash':
        tempToggle = cashToggle;
        cashToggle++;
        break;
      case 'equipment':
        tempToggle = equipmentToggle;
        equipmentToggle++;
        break;
      case 'intellectual_property':
        tempToggle = intellectual_propertyToggle;
        intellectual_propertyToggle++;
        break;
      case 'commissions':
        tempToggle = commissionsToggle;
        commissionsToggle++;
        break;
    }
    $('#' + categoryId + 'Toggle').toggleClass("glyphicon-plus-sign glyphicon-minus-sign");
    if(tempToggle % 2 == 0)
      $("." + categoryId).show(300);
    else
      $("." + categoryId).hide(300);
  };

  $('#addContribution').on('show.bs.modal', function(event){
    var button = $(event.relatedTarget);
    var name = button.data('grunt');
    var type = button.data('type');
    var date = Date.now();
    var modal = $(this);
    var formContent;
    switch(type){
      case 'time':
        formContent = "<input type='hidden' name='name' value='"+name+"'><input type='hidden' name='type' value='"+type+"'><input type='hidden' name='date' value='"+date+"'><div class='form-group'><label for='project-name' class='control-label'>Project:</label><select name='project' class='form-control'><option value=''>Select Project</option></select></div><div class='form-group'><label for='startTime' class='control-label'>Start Time:</label><input type='time' class='form-control' id='startTime' name='startTime'></div><div class='form-group'><label for='endTime' class='control-label'>End Time:</label><input type='time' class='form-control' id='endTime' name='endTime'></div><div class='form-group'><label for='urlLink' class='control-label'>Link:</label><input type='text' class='form-control' id='urlLink' name='urlLink'></div><div class='form-group'><label for='description' class='control-label'>Description:</label><textarea class='form-control' rows='3' id='description' name='description'></textarea></div>";
        break;
      case 'cash':
        formContent = "<input type='hidden' name='name' value='"+name+"'><input type='hidden' name='type' value='"+type+"'><input type='hidden' name='date' value='"+date+"'><div class='form-group'><label for='category' class='control-label'>Category:</label><select class='form-control' id='accountingCategory' name='category'><option value=''>Select Category</option><option value='minorWorkingCapital'>Minor Working Capital</option><option value='unreimbursedExpenses'>Unreimbursed Expenses</option><option value='purchasedForCompany'>Purchased for Company</option></select></div><div class='form-group'><label for='amount' class='control-label'>Amount (US$):</label><input type='number' class='form-control' id='amount' name='amount'></div><div class='form-group'><label for='description' class='control-label'>Description:</label><textarea class='form-control' rows='3' id='description' name='description'></textarea></div>";
        break;
      case 'equipment':
        formContent = "<input type='hidden' name='name' value='"+name+"'><input type='hidden' name='type' value='"+type+"'><input type='hidden' name='date' value='"+date+"'><div class='form-group'><label for='age' class='control-label'>Age:</label><select class='form-control' id='ageCategory' name='age'><option>Select Age</option><option value='lessThanYear'>Less Than 1 Year (Amount = Cost)</option><option value='moreThanYear'>More Than 1 Year (Amount = Value)</option></select></div><div class='form-group'><label for='amount' class='control-label'>Amount (US$):</label><input type='number' class='form-control' id='amount' name='amount'></div><div class='form-group'><label for='description' class='control-label'>Description:</label><textarea class='form-control' rows='3' id='description' name='description'></textarea></div>";
        break;
      case 'intellectual_property':
        formContent = "<input type='hidden' name='name' value='"+name+"'><input type='hidden' name='type' value='"+type+"'><input type='hidden' name='date' value='"+date+"'><div class='form-group'><label for='project-name' class='control-label'>Project:</label><select name='project' class='form-control'><option>Select Project</option></select></div><div class='form-group'><label for='developmentHours' class='control-label'>Development Hours:</label><input type='number' class='form-control' id='developmentHours' name='developmentHours'></div><div class='form-group'><label for='legalFees' class='control-label'>Legal Fees (US$):</label><input type='number' class='form-control' id='legalFees' name='legalFees'></div><div class='form-group'><label for='otherCosts' class='control-label'>Other Costs (US$):</label><input type='number' class='form-control' id='otherCosts' name='otherCosts'></div><div class='form-group'><label for='unpaidRoyalties' class='control-label'>Unpaid Royalties (US$):</label><input type='number' class='form-control' id='unpaidRoyalties' name='unpaidRoyalties'></div><div class='form-group'><label for='description' class='control-label'>Description:</label><textarea class='form-control' rows='3' id='description' name='description'></textarea></div>";
        break;
      case 'commissions':
        formContent = "<input type='hidden' name='name' value='"+name+"'><input type='hidden' name='type' value='"+type+"'><input type='hidden' name='date' value='"+date+"'><div class='form-group'><label for='project-name' class='control-label'>Project:</label><select name='project' class='form-control'><option>Select Project</option></select></div><div class='form-group'><label for='saleValue' class='control-label'>Sale Value (US$):</label><input type='number' class='form-control' id='saleValue'name='saleValue'></div><div class='form-group'><label for='commissionEarned' class='control-label'>Commission Earned (US$):</label><input type='number' class='form-control' id='commissionEarned' name='commissionEarned'></div><div class='form-group'><label for='description' class='control-label'>Description:</label><textarea class='form-control' rows='3' id='description' name='description'></textarea></div>";
        break;
    }
    modal.find('#addContributionLabel').html(name + "<span class='modal-category'> - Add " + type + "</span>");
    modal.find('#addContributionForm').html(formContent);
  });
  $.fn.serializeObject = function(){
    var o = {};
    var a = this.serializeArray();
    $.each(a, function(){
      if (o[this.name] !== undefined){
        if (!o[this.name].push) 
          o[this.name] = [o[this.name]];
        o[this.name].push(this.value || '');
      }
      else
        o[this.name] = this.value || '';
    });
    return o;
  };
  $(function(){
    $('#addContributionForm').submit(function(){
      var data = $('#addContributionForm').serializeObject();
      // Send form to database
      $.post("http://localhost:1337/add",data);
      console.log(data);
      return false;
    });
  });
}]);

gruntControllers.controller("historyCtrl", function($scope){

});

gruntControllers.controller("settingsCtrl", function($scope){
  $scope.init = function(){
    $('#projects').selectize({
      plugins: ['remove_button'],
      delimiter: ',',
      persist: false,
      create: function(input){
        return{
            value: input,
            text: input
        }
      }
    });
    $('#gruntProjects').selectize({
      plugins: ['remove_button'],
      delimiter: ',',
      persist: false,
      create: function(input){
        return{
            value: input,
            text: input
        }
      }
    });
  }
  $scope.init();

  $.fn.serializeObject = function(){
    var o = {};
    var a = this.serializeArray();
    $.each(a, function(){
      if (o[this.name] !== undefined){
        if (!o[this.name].push) 
          o[this.name] = [o[this.name]];
        o[this.name].push(this.value || '');
      }
      else
        o[this.name] = this.value || '';
    });
    return o;
  };
  $(function(){
    $('#addGruntSettings').submit(function(){
      var data = $('#addGruntSettings').serializeObject();
      data.startDate = new Date(data.startDate).getTime();
      // Send form to database
      $.post("http://localhost:1337/add", data);
      console.log(data);
      return false;
    });
  });

  $('#fundSettingsTrigger').click(function(){
    $('#fundSettings').show();
    $('#gruntSettings').hide();
    $('#addGruntSettings').hide();
  });
  $('#gruntSettingsTrigger').click(function(){
    $('#gruntSettings').show();
    $('#fundSettings').hide();
    $('#addGruntSettings').hide();
  });
  $('#addGruntSettingsTrigger').click(function(){
    $('#addGruntSettings').show();
    $('#gruntSettings').hide();
    $('#fundSettings').hide();
  });
});