# Beans properties deep copy
由于Clone接口的约束性，这里基于Spring提供的Beans.copyProperties()进行改造，深入拷贝Bean属性。

## 1. 阅读源码，发现原生的是浅复制，需要改造
![修改点说明](https://zzqfsy.github.io/image/spring/copyPropertiesByDeep.png)

## 2. 修改源码
深复制实现
```
package com.zzqfsy;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.BeansException;
import org.springframework.beans.FatalBeanException;
import org.springframework.util.Assert;
import org.springframework.util.ClassUtils;

import java.beans.PropertyDescriptor;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;

/**
* @Author: zzqfsy
* @Description:
* @Date: Created in 14:17 2018/5/18
* @Modified By:
**/
class DeepBeanUitls extends BeanUtils{
    /**
    * copy properties by deep 
    * For all member objects, if you want to make a deep copy, you must implement a no-argument constructor
    * @param source
    * @param target 
    */
    public static void copyPropertiesByDeep(Object source, Object target){
        copyPropertiesByDeep(source, target, null, (String[]) null);
    }

    /**
    * copy properties by deep 
    * For all member objects, if you want to make a deep copy, you must implement a no-argument constructor
    * @param source
    * @param target
    * @param editable
    * @param ignoreProperties
    * @throws BeansException
    */
    public static void copyPropertiesByDeep(Object source, Object target, Class<?> editable, String… ignoreProperties)
            throws BeansException {

        Assert.notNull(source, "Source must not be null");
        Assert.notNull(target, "Target must not be null");

        Class<?> actualEditable = target.getClass();
        if (editable != null) {
            if (!editable.isInstance(target)) {
                throw new IllegalArgumentException("Target class [" + target.getClass().getName() +
                        "] not assignable to Editable class [" + editable.getName() + "]");
            }
            actualEditable = editable;
        }
        PropertyDescriptor[] targetPds = getPropertyDescriptors(actualEditable);
        List<String> ignoreList = (ignoreProperties != null ? Arrays.asList(ignoreProperties) : null);

        for (PropertyDescriptor targetPd : targetPds) {
            Method writeMethod = targetPd.getWriteMethod();
            if (writeMethod != null && (ignoreList == null || !ignoreList.contains(targetPd.getName()))) {
                PropertyDescriptor sourcePd = getPropertyDescriptor(source.getClass(), targetPd.getName());
                if (sourcePd != null) {
                    Method readMethod = sourcePd.getReadMethod();
                    if (readMethod != null &&
                            ClassUtils.isAssignable(writeMethod.getParameterTypes()[0], readMethod.getReturnType())) {
                        try {
                            if (!Modifier.isPublic(readMethod.getDeclaringClass().getModifiers())) {
                                readMethod.setAccessible(true);
                            }
                            Object value = readMethod.invoke(source);
                            if (!Modifier.isPublic(writeMethod.getDeclaringClass().getModifiers())) {
                                writeMethod.setAccessible(true);
                            }

                            // region recursion new instance
                            Object valueTemp = null;
                            if (!value.getClass().isPrimitive()) {
                                try {
                                    valueTemp = Class.forName(value.getClass().getName()).newInstance();
                                } catch (InstantiationException ex){
                                    // catch non parametric method
                                } catch (Exception ex){
                                    // catch other exception
                                }
                                if (valueTemp != null) {
                                    copyPropertiesByDeep(value, valueTemp, editable, ignoreProperties);
                                }
                            }
                            // endregion

                            writeMethod.invoke(target, (valueTemp == null ? value : valueTemp));
                        }
                        catch (Throwable ex) {
                            throw new FatalBeanException(
                                    "Could not copy property '" + targetPd.getName() + "' from source to target", ex);
                        }
                    }
                }
            }
        }
    }
}
```

## 3. 测试用例
```
public class test {
    @Test
    public void test(){
        A a1 = new A();
        a1.b = new B(new Long(21323121));
        a1.value = new Long(31323121);
        A a2 = new A();
        DeepBeanUitls.copyPropertiesByDeep(a1, a2);
        a2.value = new Long(41323121);
        a2.b.setC(new Long(53231321));
        Assert.assertNotEquals("a.value equals", a1.value, a2.value);
        Assert.assertNotEquals("a.b.c equals", a1.b.c, a2.b.c);
    }


    public static class A {
        Long value;
        B b;

        public Long getValue() {
            return value;
        }

        public void setValue(Long value) {
            this.value = value;
        }

        public B getB() {
            return b;
        }

        public void setB(B b) {
            this.b = b;
        }
    }

    public static class B {
        public B() {
        }

        public B(Long c) {
            this.c = c;
        }

        public Long c;

        public Long getC() {
            return c;
        }

        public void setC(Long c) {
            this.c = c;
        }
    }
}
```

## 4.总结
代码目前也是挺丑的，后续想办法优化

## 相关参考资料
- none
