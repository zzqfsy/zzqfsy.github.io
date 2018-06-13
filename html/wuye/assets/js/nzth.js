// JavaScript Document
function lhjs(obj)
{
	var F10;//平均螺旋直径
	var F11;//线材直径
	var F12;//圈数
	var F13;//角度
	var F14;//固定侧力臂长
	var F15;//施力侧力臂长
	var F16;//转动角度1
	var F17;//转动角度2
	var K7;//纵向弹性系数
	var K8;//最大应力
	var K9;//RA
	var K10;//Na
	var K12;//弹簧系数
	var K13;//旋转后总长度
	var K14;//旋转后内径
	var K15;//力矩1
	var K16;//力矩2
	var K17;//作用力量1
	var K18;//作用力量2
	var K19;//应力1
	var K20;//应力2
	var K21;//安全率
	var K22;//弹簧重量
	
	
	F10 = obj.F10.value;
	F11 = obj.F11.value;
	F12 = obj.F12.value;
	F13 = obj.F13.value;
	F14 = obj.F14.value;
	F15 = obj.F15.value;
	F16 = obj.F16.value;
	F17 = obj.F17.value;

	//RA
	//=ROUND((F15^2+(F10/2)^2)^0.5,3)
	K9=(F15*F15+(F10/2)*(F10/2));
	K9 = Math.sqrt(K9);
	obj.RA.value = Math.round(K9*1000)/1000;
	
	//Na
	//=ROUND(F12+F13/360,2)
	K10=F12*1+F13/360;
	obj.Na.value = Math.round(K10*100)/100;
	

	
	if (obj.F9.value==1){
	obj.thcz_jg.value="SUS304 - WPB";
	obj.hxtxxs.value="19000";
	obj.zdyl.value="140";
	K7 = 19000;
	K8 = 140;
	}
	else{
		obj.thcz_jg.value="SWPB";
		obj.hxtxxs.value="21000";
		obj.zdyl.value="200";
		K7 = 21000;
		K8 = 200;
	}
	
	//弹簧系数
	//=ROUND((K7*F11^4)/((3667*F10*K10)+(389*(F14+F15)))*1000,2)
	K12 = (K7*F11*F11*F11*F11)/((3667*F10*K10)+(389*(F14*1+F15*1)))*1000;
	obj.thxs.value = Math.round(K12*100)/100;
	
	//旋转后总长度
	//=ROUND(F11*(K10+1+F17/360),2)
	K13=F11*(K10*1+1+F17/360);
	obj.xzhzcd.value = Math.round(K13*100)/100;
	
	//旋转后内径
	//=ROUND((F10-F11)-(F17*F10/360/K10)-0.1,1)
	K14=(F10*1-F11*1)-(F17*F10/360/K10)-0.1;
	obj.xzhnj.value = Math.round(K14*10)/10;
	
	//力矩
	//=ROUND($K$12*F16,2)
	K15=K12*F16;
	obj.lj1.value = Math.round(K15*100)/100;
	
	//力矩2
	//=ROUND($K$12*F16,2)
	K16=K12*F17;
	obj.lj2.value = Math.round(K16*100)/100;
	
	//作用力量1
	//=ROUND(K15/$K$9,2)
	K17=K15/K9;
	obj.zyll1.value = Math.round(K17*100)/100;
	
	//作用力量2
	//=ROUND($K$12*F16,2)
	K18=K16/K9;
	obj.zyll2.value = Math.round(K18*100)/100;
	
	//应力1
	//=ROUND($K$7*$F$11*F16/360/$F$10/$K$10,3)
	K19=K7*F11*F16/360/F10/K10;
	obj.yl1.value = Math.round(K19*1000)/1000;
	
	//应力2
	//=ROUND($K$7*$F$11*F17/360/$F$10/$K$10,3)
	K20=K7*F11*F17/360/F10/K10;
	obj.yl2.value = Math.round(K20*1000)/1000;
	
	//安全率
	//=ROUND(K20*100/K8,2)
	K21=K20*100/K8;
	obj.aql.value = Math.round(K21*100)/100;
	
	//弹簧重量
	//=3.14*线长*线径*线径*0.00785/4
	K22=3.14*(3.14159*(F10*1+F11*1)*F12+F14*1+F15*1)*F11*F11*0.00785/4;
	//K22=3.14159*(F10*1+F11*1)*F12+F14*1+F15*1;
	obj.thzl.value = Math.round(K22*100)/100;
	

	
}

function chthcz(obj) //弹簧材质、种类的选择，实时显示。
{
	if (obj.F9.value==1){
	obj.thcz_jg.value="SUS304 - WPB";
	obj.hxtxxs.value="19000";
	obj.zdyl.value="140";
	}
	else{
		obj.thcz_jg.value="SWPB";
		obj.hxtxxs.value="21000";
		obj.zdyl.value="200";
	}
}

		