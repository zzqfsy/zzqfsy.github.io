// JavaScript Document
function lhjs(obj)
{
	var F13;//拉簧材质
	var F14;//拉簧种类
	var F15;//弹簧拉钩长度
	var F16;//平均螺旋直径
	var F17;//线材直径
	var F18;//总圈数
	var F19;//拉伸后长度min
	var F20;//拉伸后长度max
	var K8;//横向弹性系数
	var K9;//最大应力Smax
	var K10;//初应力
	var K11;//修正系数
	var K12;//弹簧指数
	var K14;//弹性系数
	var K15;//原始自由长度
	var K16;//初张力
	var K17;//作用力量1
	var K18;//作用力量2
	var K19;//应力1
	var K20;//应力2
	var K21;//安全率
	var K23;//作用力量N1
	var K24;//作用力量N2
	
	F13 = obj.F13.value;
	F14 = obj.F14.value;
	F15 = obj.F15.value;
	F16 = obj.F16.value;
	F17 = obj.F17.value;
	F18 = obj.F18.value;
	F19 = obj.F19.value;
	F20 = obj.F20.value;
	K12 = Math.round(F16/F17*1000)/1000; //弹簧指数
	obj.thzs.value = K12;
	
	//初应力的计算
	//IF(F14=1,ROUND(0.026654*K12^2-1.5331*K12+22.21,3),IF(F14=2,IF(F17<0.5,IF(K12>=10,ROUND((175/3)-(10*K12/3),3),""),IF(K12>=9,ROUND(57.5-2.5*K12,3),35))))
	
	if(F14==1)
	{
		K10 = 0.026654*K12*K12-1.5331*K12+22.21;
	}
	else
	{
		if(F17<0.5)
		{
			if(K12>=10)
			{
				K10 = 175/3-10*K12/3;
			}
		}
		else
		{
			if(K12>=9)
			{
				K10 = 57.5-2.5*K12;
			}
			else
			{
				K10 = 35;
			}
		}
	}
	obj.cyl.value = Math.round(K10*1000)/1000;
	
	//修正系数
	//IF(F14=1,1,IF(F14=2,ROUND(((4*K12-1)/(4*K12-4)+(0.615/K12)),3)))
	if(F14==1)
	{
		K11 = 1;
	}
	else
	{
		K11 = (4*K12-1)/(4*K12-4)+(0.615/K12)
	}
	obj.xzxs.value = Math.round(K11*1000)/1000;
	
	
	if (F13==1){
	obj.thcz_jg.value="SUS304 - WPB";
	obj.hxtxxs.value="7000";
	obj.zdyl.value="61";
	K8=7000;
	K9=61;
	}
	else{
		obj.thcz_jg.value="SWPB";
		obj.hxtxxs.value="8000";
		obj.zdyl.value="78";
		K8=8000;
		K9=78;
	}
	
	if (F14==1){
		obj.thzl_jg.value="一般弹簧";
	}
	else{obj.thzl_jg.value="高张力弹簧";
	}
	
	
	//弹簧系数
	//K14=ROUND((K8*F17^4)/(8*F18*F16^3)*1000,2)
	K14=(K8*F17*F17*F17*F17)/(8*F18*F16*F16*F16)*1000;
	obj.thxs.value = Math.round(K14*100)/100;
	
	//原始自由长度
	//=F17*(F18+1)+2*F15
	K15=2*F15+F17*F18+F17*1;
	obj.yszycd.value = K15;
	
	//初张力
	//=ROUND((3.14159*F17^3*K10)/(8*F16*K11)*1000,2)
	K16 = (3.14159*F17*F17*F17*K10)/(8*F16*K11)*1000;
	obj.czl.value = Math.round(K16*100)/100;
	
	//作用力量1
	//=ROUND($K$14*(F19-$K$15)+$K$16,2)
	K17 = K14*(F19-K15)+K16
	obj.zyll1.value = Math.round(K17*100)/100;
	
	//作用力量2
	//=ROUND($K$14*(F20-$K$15)+$K$16,2)
	K18 = K14*(F20-K15)+K16
	obj.zyll2.value = Math.round(K18*100)/100;
	
	//作用力量N1,N2
	//K17*9.8/1000
	K23 = K17*9.8/1000;
	K24 = K18*9.8/1000;
	obj.zylln1.value = Math.round(K23*100)/100;
	obj.zylln2.value = Math.round(K24*100)/100;
	
	//应力1，应力2
	//=ROUND(($K$8*$F$17)/(3.14159*$F$18*$F$16^2)*(F19-$K$15)+$K10,2)
	K19 = (K8*F17)/(3.14159*F18*F16*F16)*(F19-K15)+K10;
	K20 = (K8*F17)/(3.14159*F18*F16*F16)*(F20-K15)+K10;
	obj.yl1.value = Math.round(K19*100)/100;
	obj.yl2.value = Math.round(K20*100)/100;
	
	//安全率
	//=ROUND(100*K20/K9,2)
	K21 = 100*K20/K9;
	obj.aql.value = Math.round(K21*100)/100;
	
}


function chthcz(obj) //弹簧材质、种类的选择，实时显示。
{
	if (obj.F13.value==1){
	obj.thcz_jg.value="SUS304 - WPB";
	obj.hxtxxs.value="7000";
	obj.zdyl.value="61";
	}
	else{
		obj.thcz_jg.value="SWPB";
		obj.hxtxxs.value="8000";
		obj.zdyl.value="78";
	}
	
	if (obj.F14.value==1){
		obj.thzl_jg.value="一般弹簧";
	}
	else{obj.thzl_jg.value="高张力弹簧";
	}
}

		