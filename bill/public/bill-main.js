var my_prj = {
signup: function(event){
	$(".has-error").removeClass("has-error");
	$(".form-signin").find("p").remove();

	if ($('#iPass').val().length < 3 || $('#iPass').val() != $('#iPass2').val()){
		$('.pass').addClass('has-error');
		$('#msg').clone().html("密码需要一致并且长度要大于3")
			.appendTo($('#iPass2').parent());
	}
	else{
		var data = {
			name: $('#iName').val(),
			email: $('#iEmail').val(),
			pass: $('#iPass').val()
		};
		$.post("/signup", data, function(ret){
			console.log(ret);
			if (ret.status === 'err'){
				$('#msg').clone().html(ret.msg)
					.appendTo($('#iPass2').parent());
			} else{
				location.href = '/login';
			}
		}).fail(function(){
			alert( "Sorry, there was a problem!" );
		});
	}
	return false;
},

signin: function (event){
	$(".has-error").removeClass("has-error");
	$(".form-signin").find("p").remove();

	if ($('#iPass').val().length < 3){
		$('#iPass').parent().addClass('has-error');
		$('#msg').clone().html("Password's length should longer than 3")
			.appendTo($('#iPass').parent());
	}
	else{
		var data = {
			name: $('#iName').val(),
			pass: $('#iPass').val()
		};
		$.post("/login", data, function(ret){
			console.log(ret);
			if (ret.status === 'err'){
				$('#msg').clone().html(ret.msg)
					.appendTo($('#iPass').parent());
			} else {
				location.href = '/' + data.name;
			}
		}).fail(function(){
			alert( "Sorry, there was a problem!" );
		});
	}
	return false;
},

save: function(){
	if(!document.forms.newBill.checkValidity()){
		return;
	}

	var data = {
		category: $("#category").val(),
		spend: $("#spend").val(),
		dscr: $("#dscr").val(),
	};

	$.post("/bill", data, function(ret){
		console.log(ret);
		if (ret.status === 'not-login'){
			location.href = '/login';
		} else if (ret.status === 'succ'){
			location.href = '/'+ret.name;
		} else{
			alert("服务器异常，请刷新！");
		}
	}).fail(function(){
		alert("服务器异常，请刷新！");
	});

	return false;
},


deleteImg: function(e){
	$.post("/new/delete", 
		{path: $(e.target).prev().attr('src')}, 
		function(data){
			console.log(data);
			if (data.status === 'err'){
				alert(data.msg);
			} else{
				$(e.target).parent().remove();
			}
		}).fail(function(){
			alert( "Sorry, there was a problem!" );
		});
},

upload: function(e){
	e.preventDefault();
	var v = $("input[name='upload']").val();
	console.log($("input[name='upload']").val());
	if (v === ''){
		console.log("nothing");
		return;
	}

	var fd = new FormData();
	fd.append("image", $("input[name='upload']")[0].files[0]);
	$.ajax({
		url: "/new/upload",
		data: fd,
		processData: false,
		contentType: false,
		type: "POST",
		success: function(ret){
			console.log(ret);
			var domStr = "<p><img src=";
			domStr += ret.path;
			domStr += " width=48px height=48px align='bottom'>";
			domStr += "  " + ret.path + "<input type='button' value='del' class='btn btn-primary delete'>" + "</p>";

			$("#image").append($(domStr));
			$(".delete").click(my_prj.deleteImg);
		}
	});
},

okDate: function(){	
	var d = $(".datepicker").datepicker('getDate');
	console.log(d);
	$('#selMonthModal').modal('toggle');
	var dd = new Date(d);

	$('#year').html(d.getFullYear());
	$('#month').html(d.getMonth() + 1);

	$.ajax({
		url: "/bill/month",
		data: {date: d},
		type: "POST",
		success: function(ret){
			console.log(ret);

			//dom operation
			$('#month-total').html(ret.monthTotal);
			$('#billList').empty();
			for (var i=0; i<ret.bills.length; i++){
				var domStr = "<tr><td>" + ret.bills[i].category;
				domStr += "</td><td>" + ret.bills[i].dscr;
				domStr += "</td><td>" + ret.bills[i].spend;
				domStr += "</td></tr>";
				$('#billList').append($(domStr));
			}			
		},
		fail: function(ret){
			alert(ret);
		},
	});
}

};

$(document).ready(function() {
	$("#form-signup").submit(my_prj.signup);
	$("#form-signin").submit(my_prj.signin);
	$("#save").click(my_prj.save);

	$("#upload").click(my_prj.upload);
	$(".delete").click(my_prj.deleteImg);
	$(".delPost").click(my_prj.delPost);

});
