Backbone.emulateHTTP = true;

var billApp = {};

//Bill model
var Bill = Backbone.Model.extend({
	idAttribute: "_id",
});

//month goal model
var Goal = Backbone.Model.extend({
	defaults: {
		month: 0,
		year:  0,
		goal:  0,
	},

	idAttribute: "_id",
	urlRoot: '/bill/api/goal',
});

//Bill collection
var Bills = Backbone.Collection.extend({
	model: Bill,
	url: '/bill/api/bills',

	monthTotal: function(){
		var t = 0;
		this.each(function(e){
			t += e.get('spend');
		});
		return t;
	},
	categoryTotal: function(category){
		var t = 0;
		this.each(function(e){
			if (e.get('category') === category)
				t += e.get('spend');
		});
		return t;
	}
});

billApp.bills = new Bills();
billApp.monthGoal = new Goal();


//Bill item view
var BillView = Backbone.View.extend({
	//tagName: "tr",
	template: _.template($('#item-template').html()),
	pressTimer: undefined,

	events: {
		"dblclick": 	"edit",
		"touchstart": 	"pressStart",
		"touchend": 	"pressEnd",
		"touchmove": 	"pressEnd",
	},

	initialize: function(){
		this.listenTo(this.model, 'destroy', 	this.remove);
		this.listenTo(this.model, 'change', 	this.render);
	},

	dateFormat: function(date){
		var d = new Date(date);
		var day = d.getDate();
		var hh = d.getHours();
		var mm = d.getMinutes();
		var ss = d.getSeconds();
		var week = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
		var w = d.getDay();
		if (mm<10) mm = '0' + mm;
		if (ss<10) ss = '0' + ss;
		return day+'日 '+week[w]+' '+hh+':'+mm+':'+ss;
	},

	render: function(){
		var m = this.model.toJSON();
		m.date = this.dateFormat(m.date);
		this.$el.html(this.template(m));
		return this;
	},
	edit: function(){
		app.$el.hide();
		addBillView.showWithModel(this.model);
	},
	pressStart: function(e){
		//e.preventDefault();
		var that = this;
		this.pressTimer = window.setTimeout(function(){
			that.edit();
		}, 750);

	},
	pressEnd: function(e){
		//e.preventDefault();
		window.clearTimeout(this.pressTimer);		
	},
});

//The app View
var BillAppView = Backbone.View.extend({
	el: $('#mainView'),

	events: {
		"click #save": 		"createBill",
		"click #delete": 	"deleteBill",
		"click #mainViewBtnAdd": 	"switchToAddBillView",
		"click #set": 		"setGoal",
		"blur #inputGoal": 	"setGoal",
		"keypress #inputGoal": "setGoalOnEnter",
	},

	initialize: function(){
		this.setGoalIsInput = false;
		this.categoryPercent = [];

		this.listenTo(billApp.bills, 'add', 	this.renderModel);
		this.listenTo(billApp.bills, 'reset', 	this.renderCollection);
		this.listenTo(billApp.bills, 'add', 	this.freshMonthTotal);
		this.listenTo(billApp.bills, 'remove', 	this.freshMonthTotal);
		this.listenTo(billApp.bills, 'reset', 	this.freshMonthTotal);
		this.listenTo(billApp.monthGoal, 'change', this.freshMonthGoal);

		var d = new Date();
		this.year = d.getFullYear();
		this.month = d.getMonth();
		this.freshMonthYear();

		this.$(".datepicker").datepicker({		
			language: "zh-CN",
			minViewMode: 1,
			orientation: "top auto",
			todayHighlight: true
		}).on('changeDate', this.selectDate);

		billApp.monthGoal.fetch({
			error: function(){
				console.log('fetch fail');
			},
			data: {
				month: 10,
				year: 2014,
			},
		});

		billApp.bills.fetch({
			error: function(c, r, o){
				alert("fetch fail");
			},
			reset: true,
		});		
	},

	freshMonthYear: function(){
		$('#year').html(this.year);
		$('#month').html(this.month + 1);
	},

	selectDate: function(){
		var d = $(".datepicker").datepicker('getDate');
		var y = d.getFullYear();

		if (!y) return;
		app.year = y;
		app.month = d.getMonth();
		app.freshMonthYear();

		$('#selMonthModal').modal('toggle');

		billApp.monthGoal.clear({silent: true});
		billApp.monthGoal.fetch({
			error: function(){
				console.log('fetch fail');
			},
			data: {
				month: app.month,
				year: app.year,
			},
		});

		billApp.bills.fetch({
			error: function(c, r, o){
				alert("服务器异常，请刷新！");
			},
			reset: true,
			data:{
				date: d,
			},
		});		
	},

	renderModel: function(bill){
		var view = new BillView({model: bill});
		this.$('#billList').prepend(view.render().el);
	},

	renderCollection: function(){		
		this.$('#billList').empty();		
		if (billApp.bills.length === 0) return;

		var t = $("<p></p>");

		billApp.bills.each(function(bill){
			var view = new BillView({model: bill});
			t.append(view.render().el);
		});

		this.$('#billList').append(t.children());
	},

	deleteBill: function(){
		var ret = confirm("Are you sure to delete?");
		if (ret) {
			var id = $("#save").data('id');
			billApp.bills.get(id).destroy({
				wait: true,
				error: function(m, r, o){
					alert("destroy fail");
				},				
			});

			$('#newBillModal').modal('hide');
		}

		return false;
	},

	switchToAddBillView: function(){
		this.$el.hide();
		addBillView.show();
	},

	setGoalOnEnter: function(e){
		if (e.keyCode == 13) this.setGoal();
	},

	setGoal: function(){
		var goal = billApp.monthGoal.get('goal');

		if (this.setGoalIsInput === false){
			this.setGoalIsInput = true;
			$('#goal').html("<input id='inputGoal' type=number>");
			$('#inputGoal').val(goal).focus();
			$('#set').hide();
		} else{
			this.setGoalIsInput = false;			
			var v = $('#inputGoal').val();
			if (v > 0 && v !== goal){
				billApp.monthGoal.save('goal', v, {
					error: function(){
						alert('服务器异常，请刷新！');
					},
					wait: true,
					patch: true,
				});
			}
				
			$('#goal').html(goal);			
			$('#set').show();		
		}
	},

	freshMonthGoal: function(){
		var goal = billApp.monthGoal.get('goal');
		var total = this.monthTotal;

		$('#goal').html(goal);
		$('#complete').html(Math.round(total/goal * 100) + ' %');
	},

	freshMonthTotal: function(){
		var categoryStr = ['衣', '食', '住', '行', '用', '其它'];

		this.monthTotal = billApp.bills.monthTotal();

		for (var i=0; i<categoryStr.length; i++){
			var cTotal = billApp.bills.categoryTotal(categoryStr[i]);
			this.categoryPercent[i] = Math.round(cTotal/this.monthTotal *100);
		}

		$('#month-total').html(this.monthTotal);
		$('#cat1').attr('style', "width: "+this.categoryPercent[0]+'%');
		$('#cat2').attr('style', "width: "+this.categoryPercent[1]+'%');
		$('#cat3').attr('style', "width: "+this.categoryPercent[2]+'%');
		$('#cat4').attr('style', "width: "+this.categoryPercent[3]+'%');
		$('#cat5').attr('style', "width: "+this.categoryPercent[4]+'%');
		$('#cat6').attr('style', "width: "+this.categoryPercent[5]+'%');
		$('#cat1').html(this.categoryPercent[0]+'%');
		$('#cat2').html(this.categoryPercent[1]+'%');
		$('#cat3').html(this.categoryPercent[2]+'%');
		$('#cat4').html(this.categoryPercent[3]+'%');
		$('#cat5').html(this.categoryPercent[4]+'%');
		$('#cat6').html(this.categoryPercent[5]+'%');

		this.freshMonthGoal();

		//fresh top3
		var s = billApp.bills.sortBy(function(bill){
			return bill.get('spend');
		});
		s = s.slice(s.length-3);

		$('#topList').empty();
		for (var i = 0; i < s.length; i++){
			var view = new BillView({model: s[i]});
			$('#topList').prepend(view.render().el);
		}
	},

});

//The add bill View
var AddBillView = Backbone.View.extend({
	el: $('#billAdd'),

	events: {
		"click #billAddViewBtnBack": 		"cancel",
		"click #billAddViewBtnSave": 		"createBill",		
	},

	initialize: function(){
		this.$el.hide();
	},

	show: function(){
		$("#billAddViewInCategory").val('');
		$("#billAddViewInSpend").val('');
		$("#billAddViewInDscr").val('');
		$("#billAddViewBtnSave").data('id', '');
		//$("#delete").hide();

		this.$el.show();
	},

	showWithModel: function(model){
		$("#billAddViewInCategory").val(model.get('category'));
		$("#billAddViewInSpend").val(model.get('spend'));
		$("#billAddViewInDscr").val(model.get('dscr'));
		$("#billAddViewBtnSave").data('id', model.id);
		//$("#delete").show();

		this.$el.show();
	},

	cancel: function(){
		this.$el.hide();
		app.$el.show();
	},

	createBill: function(){
		if(!document.forms.addBill.checkValidity()){
			return;
		}
		var data = {
			category: $("#billAddViewInCategory").val(),
			spend: $("#billAddViewInSpend").val(),
			dscr: $("#billAddViewInDscr").val(),
		};

		var id = $("#billAddViewBtnSave").data('id');
		
		if (id){
			billApp.bills.get(id).save(data, {
				error: function(){
					alert('服务器异常，请刷新！');
				},
				wait: true,
				patch: true,
			});
		} else {
			billApp.bills.create(data, {
				wait: true,
				error: function(){
					alert("服务器异常，请刷新！");
				},
			});			
		}

		this.cancel();

		return false;
	},
});

var app = new BillAppView();
var addBillView = new AddBillView();


var AppRouter = Backbone.Router.extend({
    routes: {
        "*actions": "defaultRoute" // matches http://example.com/#anything-here
    }
});
// Initiate the router
var app_router = new AppRouter();

app_router.on('route:defaultRoute', function(actions) {
    alert(actions);
});

// Start Backbone history a necessary step for bookmarkable URL's
Backbone.history.start({silent: true});