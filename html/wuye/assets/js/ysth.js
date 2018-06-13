// JavaScript Document
function lhjs(obj)
{
	var F10;//平均螺旋直径
	var F11;//线材直径
	var F12;//总圈数
	var F13;//原始长度
	var F14;//压缩后长度min
	var F15;//压缩后长度max
	var F17;//外径
	var F18;//内径
	var F19;//弹簧指数(旋绕比)
	var F20;//节距
	var J9;//横向弹性系数
	var J10;//最大应力
	var J12;//弹簧最小长度
	var J13;//弹簧系数
	var J14;//作用力量1
	var J15;//作用力量2
	var J16;//应力1
	var J17;//应力2
	var J18;//安全率
	var J20;//作用力量N1
	var J21;//作用力量N2
	var O7;//重量
	
	
	F10 = obj.F10.value;
	F11 = obj.F11.value;
	F12 = obj.F12.value;
	F13 = obj.F13.value;
	F14 = obj.F14.value;
	F15 = obj.F15.value;

	//外径
	F17 = F10*1+F11*1;
	obj.thwj.value = F17;
	
	//内径
	F18 = F10 - F11;
	obj.thnj.value = F18;
	
	//弹簧指数
	F19 = F10/F11
	obj.thzs.value = Math.round(F19*100)/100;
	
	//弹簧最小长度
	J12 = F12*F11 + F11*1
	obj.thzxcd.value = Math.round(J12*100)/100;
	
	//节距
	F20 = (F13-J12)/(F12-2)+F11*1
	obj.jj.value = Math.round(F20*100)/100;
	
	if (obj.F9.value==1){
	obj.thcz_jg.value="SUS304 - WPB";
	obj.hxtxxs.value="7000";
	obj.zdyl.value="76";
	J9 = 7000;
	J10 = 76;
	}
	else{
		obj.thcz_jg.value="SWPB";
		obj.hxtxxs.value="8000";
		obj.zdyl.value="98";
		J9 = 8000;
		J10 = 98;
	}
	
	//弹簧系数
	//=ROUND((J9*F11^4)/(8*(F12-2)*F10^3)*1000,2)
	J13 = (J9*F11*F11*F11*F11)/(8*(F12-2)*F10*F10*F10)*1000;
	obj.thxs.value = Math.round(J13*100)/100;
	
	//作用力量1,2
	//=ROUND(($J$13*(F13-F14)),3)
	//=ROUND(($J$13*(F13-F15)),3)
	J14 = (J13*(F13-F14))
	obj.zyll1.value = Math.round(J14*100)/100;
	J15 = (J13*(F13-F15))
	obj.zyll2.value = Math.round(J15*100)/100;
	
	//应力1,2
	//=ROUND((($J$9*$F$11)/(3.14159*($F$12-2)*F10^2))*(F13-F14),3)
	J16 = ((J9*F11)/(3.14159*(F12-2)*F10*F10))*(F13-F14)
	obj.yl1.value = Math.round(J16*100)/100;
	
	J17 = ((J9*F11)/(3.14159*(F12-2)*F10*F10))*(F13-F15)
	obj.yl2.value = Math.round(J17*100)/100;
	
	//安全率
	//=ROUND(J17*100/J10,2)
	J18 = J17*100/J10;
	obj.aql.value = Math.round(J18*100)/100;
	
	//作用力量n1，n2
	//=J14*9.8/1000
	J20 = J14*9.8/1000
	J21 = J15*9.8/1000
	obj.zylln1.value = Math.round(J20*100)/100;
	obj.zylln2.value = Math.round(J21*100)/100;
	
	//弹簧重量
	//线径*线径*中径*密度*总圈数*3.14*3.14/4
	O7 = F11*F11*F10*0.00785*F12*3.14*3.14/4;
	obj.thzl.value = Math.round(O7*100)/100;
	

	
}

function chthcz(obj) //弹簧材质、种类的选择，实时显示。
{
	if (obj.F9.value==1){
	obj.thcz_jg.value="SUS304 - WPB";
	obj.hxtxxs.value="7000";
	obj.zdyl.value="76";
	}
	else{
		obj.thcz_jg.value="SWPB";
		obj.hxtxxs.value="8000";
		obj.zdyl.value="98";
	}
}

		