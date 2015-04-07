var Module = {
  print: function(text) {console.log(text)},
  printErr: function(text) {console.error(text)},
  onRuntimeInitialized: function() {
    angular.bootstrap(document, ['complxApp']);
    angular.element($(".controller")).scope().autoScroll();
  }
}

angular.module('complxApp', ['sf.virtualScroll'])

.controller('complxController', ['$scope', 'Module', 'constants', 'settings', 'util',
  function($scope, Module, constants, settings, util) {
    $scope.constants = constants;
    $scope.settings = settings;
    $scope.util = util;
    $scope.module = Module;
    $scope.lc3_state = new Module.lc3_state();
    $scope.running = false;

    $scope.pc = function(newValue) {
      if (angular.isDefined(newValue)) {
        $scope.lc3_state.pc = 0xFFFF & newValue; 
      } else {
        return 0x100000 + $scope.lc3_state.pc;
      }
    };
    
    $scope.autoScroll = function() {      
      $(".viewport").scrollTop($scope.lc3_state.pc * 31 - $(".viewport").height()/2); 
    };

    $scope.module.lc3_init($scope.lc3_state, true);
  }
])

.controller('actionController', ['$scope', function($scope) {
  $scope.buttons = ["Run", "Run For", "Step", "Back", "Next Line", "Prev Line", "Finish", "Rewind"];
  
  $scope.doRun = function() {
    if (!$scope.running) {
      $scope.running = true;
      $scope.module.lc3_run($scope.lc3_state);
    } else {
      $scope.stopRunning();
      $scope.running = false;
      $scope.autoScroll();
    }
  };
  
  $scope.stopRunning = function() {
    $scope.module.ccall("emscripten_cancel_main_loop"); 
  };
}])

.controller('memController', ['$scope', function($scope) {
  $scope.mem = function() {
    var arr = [];
    for (var i = 0; i < $scope.constants.MEM_SIZE; i++) {
      arr.push(
        function(i) {
          return function(newValue) {
            if (angular.isDefined(newValue)) {
              $scope.module.setValue(
                $scope.lc3_state.getMem() + $scope.constants.SHORT_SIZE * i,
                newValue,
                $scope.constants.SHORT_TYPE
              );
            } else {
              return 0x100000 + $scope.module.getValue(
                $scope.lc3_state.getMem() + $scope.constants.SHORT_SIZE * i,
                $scope.constants.SHORT_TYPE
              );
            }
          }
        }(i)
      );
    }
    return arr;
  }();
}])

.controller('regController', ['$scope', function($scope) {
  $scope.reg = function() {
    var arr = [];
    for (var i = 0; i < $scope.constants.REGS_SIZE; i++) {
      arr.push(
        function(i) {
          return function(newValue) {
            if (angular.isDefined(newValue)) {
              $scope.module.setValue(
                $scope.lc3_state.getRegs() + $scope.constants.SHORT_SIZE * i,
                newValue,
                $scope.constants.SHORT_TYPE
              );
            } else {
              return 0x100000 + $scope.module.getValue(
                $scope.lc3_state.getRegs() + $scope.constants.SHORT_SIZE * i,
                $scope.constants.SHORT_TYPE
              );
            }
          }
        }(i)
      );
    }
    return arr;
  }();
}])

.service('util', ['constants', 'settings', function(constants, settings) {
  this.shortToHexString = function(number) {
    return '0x' + String('0000' + (number & 0xFFFF).toString(16).toUpperCase()).slice(-4); 
  };
    
  this.shortToBinaryString = function(number) {
    return String('0000000000000000' + (number & 0xFFFF).toString(2)).slice(-16);
  };
    
  this.shortToDecimal = function(number) {
    if (settings.decimalUnsigned) {
      return number & 0xFFFF;
    } else {
      return number & 0x8000 ? number | 0xFFFF0000 : number;
    }
  };
}])

.service('settings', function() {
  this.decimalUnsigned = false;
})

.filter('inhex', function() {
  return function(number) {
    if (number !== null && number !== undefined) {
      return String('0000' + (number).toString(16).toUpperCase()).slice(-4);
    }
  }
})

.directive('hex', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attr, ngModel) {
      ngModel.$parsers.push(function(value) {
        return /^(0x)?[0-9A-Fa-f]*$/.test(value) ? 0xFFFF & parseInt(value, 16) : undefined;
      });
      ngModel.$formatters.push(function(value) {
        return scope.util.shortToHexString(value - 0x100000);
      });
    }
  };
})

.directive('decimal', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attr, ngModel) {
      ngModel.$parsers.push(function(value) {
        // validation done since type=number
        return 0xFFFF & parseInt(value, 10);
      });
      ngModel.$formatters.push(function(value) {
        return scope.util.shortToDecimal(value - 0x100000);
      });
    }
  };
})

.directive('binary', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attr, ngModel) {
      ngModel.$parsers.push(function(value) {
        return /^[01]*$/.test(value) ? 0xFFFF & parseInt(value, 2) : undefined;
      });
      ngModel.$formatters.push(function(value) {
        return scope.util.shortToBinaryString(value - 0x100000);
      });
    }
  };
})

.service('constants', function() {
  this.SHORT_TYPE = 'i16';
  this.SHORT_SIZE =  2;

  this.MEM_START = 0x3000;
  this.MEM_SIZE = 0x10000;
  this.MEM_RANGE = Array.apply(null, {length: this.MEM_SIZE}).map(Number.call, Number);

  this.REGS_SIZE = 8;
})

.value('Module', Module);