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
	},
	memberTotal: function(category){
		var t = 0;
		this.each(function(e){
			if (e.get('member') === category)
				t += e.get('spend');
		});
		return t;
	},
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
	edit: function(){
		app.switchToAddBillView(this.model);
	},
	render: function(){
		var m = this.model.toJSON();
		m.date = this.dateFormat(m.date);
		console.log(m);
		if (!m.member) m.member="";
		this.$el.html(this.template(m));
		return this;
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
var MainView = Backbone.View.extend({
	el: $('#mainView'),

	events: {
		"click #mainViewBtnAdd": function(){this.switchToAddBillView();},
		"click #mainViewBtnChooseData": "switchToChooseDataView",		
		"click #mainViewBtnSetGoal": 	"setGoal",
		"blur #mainViewInGoal": 		"setGoal",
		"keypress #mainViewInGoal": 	function(e){
			if (e.keyCode == 13) this.setGoal();
		},
	},

	initialize: function(){
		var that = this;
		this.setGoalIsInput = false;
		this.categoryPercent = [];

		this.listenTo(billApp.bills, 'add', 	this.renderModel);
		this.listenTo(billApp.bills, 'reset', 	this.renderCollection);
		this.listenTo(billApp.bills, 'add', 	this.freshMonthTotal);
		this.listenTo(billApp.bills, 'remove', 	this.freshMonthTotal);
		this.listenTo(billApp.bills, 'reset', 	this.freshMonthTotal);
		this.listenTo(billApp.bills, 'change', 	this.freshMonthTotal);
		this.listenTo(billApp.monthGoal, 'change', this.freshMonthGoal);

		var d = new Date();
		this.year = d.getFullYear();
		this.month = d.getMonth();
		this.freshMonthYear();

		/* initialize datepicker view */
		$('#chooseDateBtnCancel').click(function(){
			that.switchToMainView($('#chooseDate'));
			return false;
		});

		$('#chooseDateBtnOK').click(function(){
			var d = $(".datepicker").datepicker('getDate');

			that.switchToMainView($('#chooseDate'), d);

			return false;
		});

		$(".datepicker").datepicker({		
			language: "zh-CN",
			minViewMode: 1,
			todayBtn: "linked",
		});

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

	renderModel: function(bill){
		var view = new BillView({model: bill});
		this.$('#mainViewBillList').prepend(view.render().el);
	},

	renderCollection: function(){		
		this.$('#mainViewBillList').empty();		
		if (billApp.bills.length === 0) return;

		var t = $("<p></p>");

		billApp.bills.each(function(bill){
			var view = new BillView({model: bill});
			t.append(view.render().el);
		});

		this.$('#mainViewBillList').append(t.children());
	},

	switchToAddBillView: function(model){		
		this.$el.hide();
		addBillView.show(model);
		appRouter.navigate("add");
	},
	switchToChooseDataView:function(){
		this.$el.hide();
		$('#chooseDate').show();
	},
	switchToMainView: function($el, date){
		$el.hide();
		this.$el.show();		

		if (date){
			if (date.getTime()){
				this.selectDate(date);
			}
		}
		appRouter.navigate("");
	},

	selectDate: function(d){
		var y = d.getFullYear();

		if (!y) return;
		app.year = y;
		app.month = d.getMonth();
		app.freshMonthYear();

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

	setGoal: function(){
		var goal = billApp.monthGoal.get('goal');

		if (this.setGoalIsInput === false){
			this.setGoalIsInput = true;
			$('#mainViewSpanGoal').html("<input id='mainViewInGoal' type=number>");
			$('#mainViewInGoal').val(goal).focus();
			$('#mainViewBtnSetGoal').hide();
		} else{
			this.setGoalIsInput = false;			
			var v = $('#mainViewInGoal').val();
			if (v > 0 && v !== goal){
				billApp.monthGoal.save('goal', v, {
					error: function(){
						alert('服务器异常，请刷新！');
					},
					wait: true,
					patch: true,
				});
			}
				
			$('#mainViewSpanGoal').html(goal);			
			$('#mainViewBtnSetGoal').show();		
		}
	},

	freshMonthYear: function(){
		$('#mainViewSpanYear').html(this.year);
		$('#mainViewSpanMonth').html(this.month + 1);
	},	

	freshMonthGoal: function(){
		var goal = billApp.monthGoal.get('goal');
		var total = this.monthTotal;

		$('#mainViewSpanGoal').html(goal);
		$('#complete').html(Math.round(total/goal * 100) + ' %');
	},

	freshMonthTotal: function(){
		var categoryStr = ['衣', '食', '住', '行', '用', '其它'];
		var memberStr = ['我', '他', '果果'];
		var memberPercent = [];

		this.monthTotal = billApp.bills.monthTotal();

		for (var i=0; i<categoryStr.length; i++){
			var cTotal = billApp.bills.categoryTotal(categoryStr[i]);
			this.categoryPercent[i] = Math.round(cTotal/this.monthTotal *100);
		}

		for (i=0; i<memberStr.length; i++){
			var cTotal = billApp.bills.memberTotal(memberStr[i]);
			memberPercent[i] = Math.round(cTotal/this.monthTotal *100);
		}

		$('#mainViewMonthTotal').html(this.monthTotal);
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

		$('#catMe').attr('style', "width: "+memberPercent[0]+'%');
		$('#catHe').attr('style', "width: "+memberPercent[1]+'%');
		$('#catGuoguo').attr('style', "width: "+memberPercent[2]+'%');

		$('#catMe').html(memberPercent[0]+'%');
		$('#catHe').html(memberPercent[1]+'%');
		$('#catGuoguo').html(memberPercent[2]+'%');

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

		$.post('/bill/api/bills/calcyear', {year: app.year}, function(data, st){			
			$('#mainViewYearTotal').html(data.value);
		});
	},

});

//The add bill View
var AddBillView = Backbone.View.extend({
	el: $('#addBill'),

	events: {
		"click #addBillViewBtnCancel": 
			function(){app.switchToMainView(this.$el); return false},
		"click #addBillViewBtnSave": 		"createBill",
		"click #addBillViewBtnDelete": 		"deleteBill",
	},

	initialize: function(){
		this.$el.hide();
	},

	show: function(model){
		if (model){
			$("#addBillViewInCategory").val(model.get('category'));
			$("#addBillViewInMember").val(model.get('member'));
			$("#addBillViewInSpend").val(model.get('spend'));
			$("#addBillViewInDscr").val(model.get('dscr'));
			$("#addBillViewBtnSave").data('id', model.id);
			$("#addBillViewBtnDelete").show();
		} else {
			$("#addBillViewInCategory").val('');
			$("#addBillViewInMember").val('');
			$("#addBillViewInSpend").val('');
			$("#addBillViewInDscr").val('');
			$("#addBillViewBtnSave").data('id', '');
			$("#addBillViewBtnDelete").hide();
		}		

		this.$el.show();
	},

	createBill: function(){
		if(!document.forms.addBill.checkValidity()){
			return;
		}
		var data = {
			category: $("#addBillViewInCategory").val(),
			spend: $("#addBillViewInSpend").val(),
			dscr: $("#addBillViewInDscr").val(),
			member: $("#addBillViewInMember").val(),
		};

		var id = $("#addBillViewBtnSave").data('id');
		
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

		app.switchToMainView(this.$el);

		return false;
	},

	deleteBill: function(){
		var ret = confirm("Are you sure to delete?");
		if (ret) {
			var id = $("#addBillViewBtnSave").data('id');
			billApp.bills.get(id).destroy({
				wait: true,
				error: function(m, r, o){
					alert("destroy fail");
				},				
			});

			app.switchToMainView(this.$el);			
		}
		return false;
	},
});

var app = new MainView();
var addBillView = new AddBillView();

var AppRouter = Backbone.Router.extend({
	routes: {
		"add"		: function(){
			app.switchToAddBillView();
		},
		"(/)"			: function(){
			app.switchToMainView($('#addBill'));
		},
	}
});
// Initiate the router
var appRouter = new AppRouter();

// Start Backbone history a necessary step for bookmarkable URL's
Backbone.history.start({silent: true});
