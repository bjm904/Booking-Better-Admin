function parseURLParams(url){
    var queryStart = url.indexOf("?") + 1,
        queryEnd   = url.indexOf("#") + 1 || url.length + 1,
        query = url.slice(queryStart, queryEnd - 1),
        pairs = query.replace(/\+/g, " ").split("&"),
        parms = {}, i, n, v, nv;
    if (query === url || query === "") {
        return;
    }
    for (i = 0; i < pairs.length; i++) {
        nv = pairs[i].split("=");
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);
        if (!parms.hasOwnProperty(n)) {
            parms[n] = [];
        }
        parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}
var statuses={"ok":"Ok", "cancelled_by_guest":"Cancelled", "cancelled_by_hotel":"Cancelled", "no_show":"No Show"};
function parseBookData(rawData){
	var array=[];
	for(var i=0;i<rawData.length;i++){
		if(rawData[i].Book_nr.length<6) continue;
		var obj={};
		obj.bookNum=Number(rawData[i].Book_nr);
		obj.bookDate=formatDate(rawData[i].Book_date);
		var names=rawData[i].Booker_name.split(",");
		obj.bookName=names[1].replace(" ", "")+" "+names[0];
		obj.arriveDate=formatDate(rawData[i].Arrival);
		obj.departDate=formatDate(rawData[i].Departure);
		obj.status=statuses[rawData[i].Status];
		obj.total=getMoney(rawData[i].Total);
		obj.commission=getMoney(rawData[i].Commission);
		array.push(obj);
	};
	return array;
};
function formatDate(dateData){
	var date=new Date(dateData);
	var d=date.getDate();
	var m=date.getMonth()+1;
	var y=date.getFullYear();
	d=('0'+d).slice(-2);
	m=('0'+m).slice(-2);
	return y+"-"+m+"-"+d;
}
function getMoney(moneyData){
	moneyData=moneyData.replace("USD", "");
	moneyData=moneyData.replace(" ", "");
	moneyData=Number(moneyData);
	return moneyData*100;
}
function formatMoney(moneyData){
	moneyData=moneyData/100;
	return "$"+moneyData.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
}
function getTotal(data, prop){
	var total=0;
	for(var i=0;i<data.length;i++){
		total+=data[i][prop];
	}
	return total;
}
function countProp(data, prop, value){
	var total=0;
	for(var i=0;i<data.length;i++){
		if(data[i][prop]==value) total++;
	}
	return total;
}
function getTotalZeros(data){
	var total=0;
	for(var i=0;i<data.length;i++){
		if(data[i].status=="Ok"&&data[i].commission==0) total++;
	}
	return total;
}

var GET=parseURLParams(location.href);
var ses=GET.ses[0];
var hotel_id=GET.hotel_id[0];


function displayDataTotals(data){
	var html='';
	if(data){
		html+="<tr><td>Reservations: </td><td>"+data.length+"</td></tr>";
		html+="<tr><td>Total: </td><td>"+formatMoney(getTotal(data, "total"))+"</td></tr>";
		html+="<tr><td>Commission: </td><td>"+formatMoney(getTotal(data, "commission"))+"</td></tr>";
		html+="<tr><td><br></td><td></td></tr>";
		var ok=countProp(data, "status", "Ok");
		html+="<tr><td>Ok: </td><td>"+ok+"</td><td>("+(Math.round(ok/data.length*1000)/10).toFixed(1)+"%)</td></tr>";
		var cancelled=countProp(data, "status", "Cancelled");
		html+="<tr><td>Cancelled: </td><td>"+cancelled+"</td><td>("+(Math.round(cancelled/data.length*1000)/10).toFixed(1)+"%)</td></tr>";
		var noshow=countProp(data, "status", "No Show");
		html+="<tr><td>No Show: </td><td>"+noshow+"</td><td>("+(Math.round(noshow/data.length*1000)/10).toFixed(1)+"%)</td></tr>";
		html+="<tr><td><br></td><td></td></tr>";
		var zero=getTotalZeros(data);
		html+="<tr class='rowZero'><td>Zero Commission: </td><td>"+zero+"</td><td>("+Math.round(zero/data.length*1000)/10+"%)</td></tr>";
	}
	$("#totalsTable").html(html);
}
function displayDataTable(data){
	var html="";
	if(data){
		html+='<tr><th>Res. Number</th><th>Name</th><th>Status</th><th>Date Booked</th><th>Arrival Date</th><th>Departure Date</th><th class="moneyCol">Total</th><th class="moneyCol">Commission</th></tr>';
		for(var i=0;i<data.length;i++){
			var row=data[i].status;
			if(row=="Ok"&&data[i].commission==0) row="Zero";
			html+="<tr class='row"+row+"'>";
			html+="<td><a href='https://admin.booking.com/hotel/hoteladmin/bookings/booking.html?lang=en&hotel_id="+hotel_id+"&ses="+ses+"&bn="+data[i].bookNum+"' target='_blank'>"+data[i].bookNum+"</a></td>";
			html+="<td>"+data[i].bookName+"</td>";
			html+="<td>"+data[i].status+"</td>";
			html+="<td>"+data[i].bookDate+"</td>";
			html+="<td>"+data[i].arriveDate+"</td>";
			html+="<td>"+data[i].departDate+"</td>";
			html+="<td class='moneyCol'>"+formatMoney(data[i].total)+"</td>";
			html+="<td class='moneyCol'>"+formatMoney(data[i].commission)+"</td>";
			html+="</tr>";
		}
	}
	$("#dataTable").html(html);
}
function loading(bool){
	$("#loading").toggle(bool);
	$("#goButton").toggle(!bool);
	if(bool){
	} else{
	}
};

function getData(type, stay_from, stay_to, cb){
	var url="https://admin.booking.com/hotel/hoteladmin/download_results.html?ses="+ses+"&hotel_id="+hotel_id+"&type="+type+"&stay_from="+formatDate(stay_from)+"&stay_to="+formatDate(stay_to)+"&stage=1&page=1&lang=en&perpage=50&format=csv";
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange=function(){
		if(xhttp.readyState==4){
			if(xhttp.status==200){
				if(xhttp.responseText.indexOf("Book_nr")==0){
					loading(false);
					if(cb) cb(parseBookData(Papa.parse(xhttp.responseText, {header: true}).data));
				} else{
					$("#loading").html("Something went wrong. Maybe <a href='https://admin.booking.com/hotel/hoteladmin/index-hotel.html'>login</a> again.");
				}
			} else{
				if(cb) cb(false);
			}
		}
	}
	xhttp.open("GET", url, true);
	xhttp.send();
}
function filterData(data){
	if($("#row2Enable").prop("checked")){
		var typeRaw=$("#row2Type").val();
		var sortProp="arriveDate";
		if(typeRaw=="booking"){
			sortProp="bookDate";
		} else if(typeRaw=="departure"){
			sortProp="departDate";
		}
		var fromDate=new Date($("#row2FromDate").val());
		var toDate=new Date($("#row2ToDate").val());
		for(var i=data.length-1;i>-1;i--){
			var flag=false;
			var date=new Date(data[i][sortProp]);
			if(date<fromDate||date>toDate){
				flag=true;
			}
			if(flag){
				data.splice(i, 1);
			}
		}
	}
	for(var i=data.length-1;i>-1;i--){
		var flag=false;
		if(data[i].status=="Ok"&&!$("#showOk").prop("checked")) flag=true;
		if(data[i].status=="Cancelled"&&!$("#showCancelled").prop("checked")) flag=true;
		if(data[i].status=="No Show"&&!$("#showNoShow").prop("checked")) flag=true;
		if(flag){
			data.splice(i, 1);
		}
	}
	return data;
}

$("#row2Enable").change(function(){
	if($(this).prop("checked")){
		$(".row2Togglable").show();
	} else{
		$(".row2Togglable").hide();
	}
});
$("#goButton").click(function(){
	displayDataTotals();
	displayDataTable();
	loading(true);
	
	var type=$("#row1Type").val();
	
	var flag;
	var rawFromDate1=$("#row1FromDate").val();
	var rawToDate1=$("#row1ToDate").val();
	if(rawFromDate1&&rawToDate1){
		var fromDate1=new Date(rawFromDate1);
		var toDate1=new Date(rawToDate1);
		if(fromDate1>toDate1){
			flag=true;
		}
	} else flag=true;
	if($("#row2Enable").prop("checked")){
		var rawFromDate2=$("#row2FromDate").val();
		var rawToDate2=$("#row2ToDate").val();
		if(rawFromDate2&&rawToDate2){
			var fromDate2=new Date(rawFromDate2);
			var toDate2=new Date(rawToDate2);
			if(fromDate2>toDate2){
				flag=true;
			}
		} else flag=true;
	}
	if(!flag){
		getData(type, rawFromDate1, rawToDate1, function(data){
			data=filterData(data);
			if(data){
				displayDataTotals(data);
				displayDataTable(data);
			} else{
				alert("There was an error!");
			}
		});
	} else{
		alert("A date is wrong or not set");
		loading(false);
	}
});