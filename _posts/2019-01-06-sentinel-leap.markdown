# Sentinel滑动窗口实现原理解析
## 核心思想
https://sentinelguard.io/zh-cn/docs/basic-implementation.html

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0786db3643be453fb1c53994b121a75c~tplv-k3u1fbpfcp-watermark.image?)

## 运行一下
### 运行程序
```
public class BucketLeapArrayTestDemo {

    public static void main(String[] args){
        // 2个桶，2秒窗口，1秒的窗口桶
        BucketLeapArray bucketLeapArray = new BucketLeapArray(2, 2000);

        while (true) {
            Long value = System.currentTimeMillis();
            
            // 获取桶
            MetricBucket metricBucket = bucketLeapArray.getWindowValue(value);
            if (metricBucket == null){
                bucketLeapArray.currentWindow(value);
                metricBucket = bucketLeapArray.getWindowValue(value);
            }
            
            // 限流10个
            if (metricBucket.get(MetricEventType.PASS) < 10){
                metricBucket.addPass(1);
            } else {
                metricBucket.addBlock(1);
            }

            System.out.println("window print:" + bucketLeapArray.array);

            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        }
    }
}
```

### 运行结果
```
window print:[null, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 1, block: 0}]
window print:[null, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 2, block: 0}]
window print:[null, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 3, block: 0}]
window print:[null, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 4, block: 0}]
window print:[null, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 5, block: 0}]
window print:[null, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 6, block: 0}]
window print:[null, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 7, block: 0}]
window print:[null, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 8, block: 0}]
window print:[null, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 9, block: 0}]
window print:[null, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 0}]
window print:[null, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 1}]
window print:[null, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 2}]
window print:[null, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 3}]
window print:[WindowWrap{windowLengthInMs=1000, windowStart=1669050282000, value=pass: 1, block: 0}, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 3}]
window print:[WindowWrap{windowLengthInMs=1000, windowStart=1669050282000, value=pass: 2, block: 0}, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 3}]
window print:[WindowWrap{windowLengthInMs=1000, windowStart=1669050282000, value=pass: 3, block: 0}, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 3}]
window print:[WindowWrap{windowLengthInMs=1000, windowStart=1669050282000, value=pass: 4, block: 0}, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 3}]
window print:[WindowWrap{windowLengthInMs=1000, windowStart=1669050282000, value=pass: 5, block: 0}, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 3}]
window print:[WindowWrap{windowLengthInMs=1000, windowStart=1669050282000, value=pass: 6, block: 0}, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 3}]
window print:[WindowWrap{windowLengthInMs=1000, windowStart=1669050282000, value=pass: 7, block: 0}, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 3}]
window print:[WindowWrap{windowLengthInMs=1000, windowStart=1669050282000, value=pass: 8, block: 0}, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 3}]
window print:[WindowWrap{windowLengthInMs=1000, windowStart=1669050282000, value=pass: 9, block: 0}, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 3}]
window print:[WindowWrap{windowLengthInMs=1000, windowStart=1669050282000, value=pass: 10, block: 0}, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 3}]
window print:[WindowWrap{windowLengthInMs=1000, windowStart=1669050282000, value=pass: 10, block: 1}, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 3}]
window print:[WindowWrap{windowLengthInMs=1000, windowStart=1669050282000, value=pass: 10, block: 2}, WindowWrap{windowLengthInMs=1000, windowStart=1669050281000, value=pass: 10, block: 3}]
```


## 滑动窗口初始化
``` java
public abstract class LeapArrayInit<T> {

    /**
     * 默认60个桶
     */
    private final Integer DEFAULT_SAMPLE_COUNT = 60;
    /**
     * 默认窗口60s，每个桶1s
     */
    private final Integer DEFAULT_INTERVAL_IN_MS = 60000;

    /**
     * 窗口单个桶时间-毫秒
     */
    protected int windowLengthInMs;
    /**
     * 窗口总间隔时间-毫秒
     */
    protected int intervalInMs;
    /**
     * 窗口桶个数
     */
    protected int sampleCount;
    /**
     * 窗口桶数组
     */
    protected final AtomicReferenceArray<WindowWrap<T>> array;


    /**
     * 窗口桶个数 sampleCount = 窗口总间隔时间 intervalInMs / 窗口桶时间 windowLengthInMs.
     *
     * @param sampleCount  窗口桶个数
     * @param intervalInMs 窗口间隔时间
     */
    public LeapArrayInit(Integer sampleCount, Integer intervalInMs) {
        sampleCount = sampleCount != null ? sampleCount : DEFAULT_SAMPLE_COUNT;
        intervalInMs = intervalInMs != null ? intervalInMs : DEFAULT_INTERVAL_IN_MS;

        this.windowLengthInMs = intervalInMs / sampleCount;
        this.intervalInMs = intervalInMs;
        this.sampleCount = sampleCount;

        this.array = new AtomicReferenceArray<>(sampleCount);
    }
}
```

## 滑动窗口环窗口实现
```
public abstract class LeapArrayCore<T> extends LeapArrayInit<T> {

    /**
     * 窗口桶个数 sampleCount = 窗口总间隔时间 intervalInMs / 窗口桶时间 windowLengthInMs.
     *
     * @param sampleCount  窗口桶个数
     * @param intervalInMs 窗口间隔时间
     */
    public LeapArrayCore(Integer sampleCount, Integer intervalInMs) {
        super(sampleCount, intervalInMs);
    }

    /**
     * 只有当前桶过期的时候进行删除互斥
     */
    private final ReentrantLock updateLock = new ReentrantLock();

    /**
     * 获取当前时间的窗口
     *
     * @param timeMillis 当前毫秒时间
     * @return 当前时间匹配的窗口
     */
    public WindowWrap<T> currentWindow(long timeMillis) {
        if (timeMillis < 0) {
            return null;
        }

        // 根据当前时间计算出当前时间属于那个滑动窗口的数组下标
        int idx = calculateTimeIdx(timeMillis);
        // 根据当前时间计算出当前滑动窗口的开始时间
        long windowStart = calculateWindowStart(timeMillis);

        /*
         * 根据下脚标在环形数组中获取滑动窗口（桶）
         *
         */
        while (true) {
            WindowWrap<T> old = array.get(idx);
            // 如果桶不存在则创建新的桶，并通过CAS将新桶赋值到数组下标位
            if (old == null) {
                WindowWrap<T> window = new WindowWrap<T>(windowLengthInMs, windowStart, newEmptyBucket(timeMillis));
                if (array.compareAndSet(idx, null, window)) {
                    // Successfully updated, return the created bucket.
                    return window;
                } else {
                    // cas竞争创建桶失败，则当前线程回到就绪态，让出CPU给正在创建桶的线程，后续再尝试
                    Thread.yield();
                }
            }
            // 如果获取到的桶不为空，并且桶的开始时间等于刚刚算出来的时间，那么返回当前获取到的桶。
            else if (windowStart == old.windowStart()) {
                return old;
            }
            // 如果获取到的桶不为空，并且桶的开始时间小于刚刚算出来的开始时间，那么说明这个桶是上一圈用过的桶，重置当前桶
            // 桶环
            else if (windowStart > old.windowStart()) {
                if (updateLock.tryLock()) {
                    try {
                        return resetWindowTo(old, windowStart);
                    } finally {
                        updateLock.unlock();
                    }
                } else {
                    Thread.yield();
                }
            }
            // 如果获取到的桶不为空，并且桶的开始时间大于刚刚算出来的开始时间，理论上不应该出现这种情况，返回新桶
            else if (windowStart < old.windowStart()) {
                return new WindowWrap<T>(windowLengthInMs, windowStart, newEmptyBucket(timeMillis));
            }
        }
    }

    /**
     * 计算滑动窗口的数组下标
     * @param timeMillis
     * @return
     */
    protected int calculateTimeIdx(/*@Valid*/ long timeMillis) {
        // 除法取整，保证了一秒内的所有时间搓得到的timeId是相等的
        long timeId = timeMillis / windowLengthInMs;
        // 求余运算，保证一秒内获取到的桶的下标位是一致的
        return (int)(timeId % array.length());
    }

    /**
     * 计算滑动窗口的开始时间
     * @param timeMillis
     * @return
     */
    protected long calculateWindowStart(/*@Valid*/ long timeMillis) {
        // 求余运算原则，保证一秒内获取到的桶的开始时间是一致的
        // 100 - 100 % 10 = 100 - 0 = 100
        // 101 - 101 % 10 = 101 - 1 = 100
        // 102 - 102 % 10 = 102 - 2 = 100
        return timeMillis - timeMillis % windowLengthInMs;
    }

    /**
     * 创建空的滑动窗口
     *
     * @param timeMillis current time in milliseconds
     * @return the new empty bucket
     */
    public abstract T newEmptyBucket(long timeMillis);


    /**
     * 重制滑动窗口
     *
     * @param startTime  the start time of the bucket in milliseconds
     * @param windowWrap current bucket
     * @return new clean bucket at given start time
     */
    protected abstract WindowWrap<T> resetWindowTo(WindowWrap<T> windowWrap, long startTime);
}
```

## 滑动窗口通用功能
```
public abstract class LeapArray<T> extends LeapArrayCore<T>{

    /**
     * 窗口桶个数 sampleCount = 窗口总间隔时间 intervalInMs / 窗口桶时间 windowLengthInMs.
     *
     * @param sampleCount  窗口桶个数
     * @param intervalInMs 窗口间隔时间
     */
    public LeapArray(Integer sampleCount, Integer intervalInMs) {
        super(sampleCount, intervalInMs);
    }

    /**
     * 获取当前时间的前一个桶
     *
     * @param timeMillis a valid timestamp in milliseconds
     * @return the previous bucket item before provided timestamp
     */
    public WindowWrap<T> getPreviousWindow(long timeMillis) {
        if (timeMillis < 0) {
            return null;
        }
        int idx = calculateTimeIdx(timeMillis - windowLengthInMs);
        timeMillis = timeMillis - windowLengthInMs;
        WindowWrap<T> wrap = array.get(idx);

        if (wrap == null || isWindowDeprecated(timeMillis, wrap)) {
            return null;
        }

        if (wrap.windowStart() + windowLengthInMs < (timeMillis)) {
            return null;
        }

        return wrap;
    }

    /**
     * 获取窗口的值
     * @param timeMillis
     * @return
     */
    public T getWindowValue(long timeMillis) {
        if (timeMillis < 0) {
            return null;
        }
        int idx = calculateTimeIdx(timeMillis);

        WindowWrap<T> bucket = array.get(idx);

        if (bucket == null || !bucket.isTimeInWindow(timeMillis)) {
            return null;
        }

        return bucket.value();
    }

    /**
     * 获取所有桶
     *
     * @param includeDeprecated 包含过期
     * @return
     */
    public List<WindowWrap<T>> list(Boolean includeDeprecated) {
        int size = array.length();
        List<WindowWrap<T>> result = new ArrayList<WindowWrap<T>>(size);

        for (int i = 0; i < size; i++) {
            WindowWrap<T> windowWrap = array.get(i);
            if (windowWrap == null) {
                continue;
            }
            if (includeDeprecated || isWindowDeprecated(System.currentTimeMillis(), windowWrap)){
                continue;
            }
            result.add(windowWrap);
        }

        return result;
    }

    /**
     * 获取所有值
     * @return
     */
    public List<T> values(Boolean includeDeprecated) {
        int size = array.length();
        List<T> result = new ArrayList<T>(size);

        for (int i = 0; i < size; i++) {
            WindowWrap<T> windowWrap = array.get(i);
            if (windowWrap == null) {
                continue;
            }
            if (includeDeprecated || isWindowDeprecated(System.currentTimeMillis(), windowWrap)){
                continue;
            }
            result.add(windowWrap.value());
        }
        return result;
    }

    public boolean isWindowDeprecated(long time, WindowWrap<T> windowWrap) {
        return time - windowWrap.windowStart() > intervalInMs;
    }
}
```

## 简单滑动窗口实现
```
public class BucketLeapArray extends LeapArray<MetricBucket> {

    public BucketLeapArray(int sampleCount, int intervalInMs) {
        super(sampleCount, intervalInMs);
    }

    @Override
    public MetricBucket newEmptyBucket(long time) {
        return new MetricBucket();
    }

    @Override
    protected WindowWrap<MetricBucket> resetWindowTo(WindowWrap<MetricBucket> w, long startTime) {
        // Update the start time and reset value.
        w.resetTo(startTime);
        w.value().reset();
        return w;
    }

}
```


## 核心模型
### 窗口桶包装
```
public class WindowWrap<T> {

    /**
     * Time length of a single window bucket in milliseconds.
     */
    private final long windowLengthInMs;

    /**
     * Start timestamp of the window in milliseconds.
     */
    private long windowStart;

    /**
     * Statistic data.
     */
    private T value;

    /**
     * @param windowLengthInMs a single window bucket's time length in milliseconds.
     * @param windowStart      the start timestamp of the window
     * @param value            statistic data
     */
    public WindowWrap(long windowLengthInMs, long windowStart, T value) {
        this.windowLengthInMs = windowLengthInMs;
        this.windowStart = windowStart;
        this.value = value;
    }

    public long windowLength() {
        return windowLengthInMs;
    }

    public long windowStart() {
        return windowStart;
    }

    public T value() {
        return value;
    }

    public void setValue(T value) {
        this.value = value;
    }

    /**
     * Reset start timestamp of current bucket to provided time.
     *
     * @param startTime valid start timestamp
     * @return bucket after reset
     */
    public WindowWrap<T> resetTo(long startTime) {
        this.windowStart = startTime;
        return this;
    }

    /**
     * Check whether given timestamp is in current bucket.
     *
     * @param timeMillis valid timestamp in ms
     * @return true if the given time is in current bucket, otherwise false
     * @since 1.5.0
     */
    public boolean isTimeInWindow(long timeMillis) {
        return windowStart <= timeMillis && timeMillis < windowStart + windowLengthInMs;
    }

    @Override
    public String toString() {
        return "WindowWrap{" +
                "windowLengthInMs=" + windowLengthInMs +
                ", windowStart=" + windowStart +
                ", value=" + value +
                '}';
    }
```


### 窗口桶计量，T
```
public class MetricBucket {

    private final LongAdder[] counters;

    public MetricBucket() {
        MetricEventType[] events = MetricEventType.values();
        this.counters = new LongAdder[events.length];
        for (MetricEventType event : events) {
            counters[event.ordinal()] = new LongAdder();
        }
    }

    public MetricBucket reset(MetricBucket bucket) {
        for (MetricEventType event : MetricEventType.values()) {
            counters[event.ordinal()].reset();
            counters[event.ordinal()].add(bucket.get(event));
        }
        return this;
    }

    /**
     * Reset the adders.
     *
     * @return new metric bucket in initial state
     */
    public MetricBucket reset() {
        for (MetricEventType event : MetricEventType.values()) {
            counters[event.ordinal()].reset();
        }
        return this;
    }

    public long get(MetricEventType event) {
        return counters[event.ordinal()].sum();
    }

    public MetricBucket add(MetricEventType event, long n) {
        counters[event.ordinal()].add(n);
        return this;
    }

    public long pass() {
        return get(MetricEventType.PASS);
    }

    public long block() {
        return get(MetricEventType.BLOCK);
    }

    public void addPass(int n) {
        add(MetricEventType.PASS, n);
    }

    public void addBlock(int n) {
        add(MetricEventType.BLOCK, n);
    }

    @Override
    public String toString() {
        return "pass: " + pass() + ", block: " + block();
    }
}
```

### 窗口桶计量事件类型
```
public enum MetricEventType {
    /**
     * Normal pass.
     */
    PASS,
    /**
     * Normal block.
     */
    BLOCK,
    EXCEPTION,
    SUCCESS,
    RT,

    /**
     * Passed in future quota (pre-occupied, since 1.5.0).
     */
    OCCUPIED_PASS
}
```