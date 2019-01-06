# Mockito结合Spring App单元测试 - 示例篇
当服务拆分到一定的粒度后，对内部的环境依赖、外部的服务调用，都是单测面临的问题。

本文依托Mockito作Spring应用单元测试的一种方案示例

```
关于Mockito的使用，请查看官方文档
```

相关官方参考资料
- [Mockito官方地址](https://site.mockito.org)
- [Mockito官方文档](https://static.javadoc.io/org.mockito/mockito-core/2.18.0/org/mockito/Mockito.html)

示例代码
- [示例代码](https://github.com/zzqfsy/spring-distributed-transaction) 

## 1. 内部环境依赖解决
我们的单元测试需要在任何场景下都可以运行，而大多数的应用会受限于各种外部中间件而无法启动，如mysql、mongo、redis、kafka、es等。
这些中间件对于测试业务场景来说，有些模拟个代理对象即可，而有些则需要完整的对象。

示例代码依赖的内部环境有mysql、redis, 看下是如何区分对待。

### 1.1 通过内存数据库h2解决mysql依赖问题；
依托Spring boot引入的内嵌web容器、内嵌h2数据库，兼容sql、jdbc的方案，便捷的一把拉起运行测试。

示例代码片段:
* [application.yml](https://github.com/zzqfsy/spring-distributed-transaction/blob/master/account-service/src/test/resources/application.yml)

```yaml
spring:
  datasource:
    driver-class-name: org.h2.Driver
    url: jdbc:h2:mem:test;MODE=MySQL
    schema: 
```

* [BaseTest.java](https://github.com/zzqfsy/spring-distributed-transaction/blob/master/account-service/src/test/java/com/zzqfsy/account/test/base/BaseTest.java)

```java
@RunWith(SpringJUnit4ClassRunner.class)
//@RunWith(MockitoJUnitRunner.class)
@SpringBootTest
@Transactional
@Rollback
@ActiveProfiles("test")
public abstract class BaseTest {

}
```

### 1.2 通过Mock对象解决redis依赖问题；
redisson是redis的一个客户端实现，通过Mock对象RedissonClient注入容器来解决依赖问题，这样做的原因有：
1. 在示例代码中的主要作用是分布式锁，这对业务代码单元测试的重要性不高；
2. 笔者暂未找到直接拉起的测试内存数据库方案；
3. 专门为单测依赖开个防腐层感觉很鸡肋；


示例代码片段
* [BaseMockConfigTest](https://github.com/zzqfsy/spring-distributed-transaction/blob/master/account-service/src/test/java/com/zzqfsy/account/test/base/BaseMockConfigTest.java)

```java
@Configuration
public class BaseMockConfigTest {

    @Bean
    @Primary
    public RedissonClient redissonClient(){
        return Mockito.mock(RedissonClient.class);
    }
}
```

示例代码片段
* [TAccountDAOTest](https://github.com/zzqfsy/spring-distributed-transaction/blob/master/account-service/src/test/java/com/zzqfsy/account/test/account/dao/TAccountDAOTest.java)

```java
public class TAccountDAOTest extends BaseTest {

    @Autowired
    private TAccountDAO tAccountDAO;

    @Test
    public void accountExist(){
        Account account = tAccountDAO.selectByPrimaryKey(2);
        Assert.assertNotNull(account);
    }

    @Test
    public void accountNotExist(){
        Account account = tAccountDAO.selectByPrimaryKey(3);
        Assert.assertNull(account);
    }
}
```

### 1.3 整合测试
当我们期望在执行的代码中，一部分是代码真实的实现，另一部分是预设结果的实现，结合Mock + Spy + Stubbing可以帮我们做到。
> 在某些场景下，我们期望一些功能点能通过预设的输入，得到预设的输出，我们把这个过程叫做测试打桩(Stubbing)。
> <br /> 
> Spy对象，是个间谍，大多数行为都是真实行为，只有遇到预设的指令时（间谍收到命令），才会开始黑暗的一面...

示例代码片段
* [TAccountRepositoryTest](https://github.com/zzqfsy/spring-distributed-transaction/blob/master/account-service/src/test/java/com/zzqfsy/account/test/account/repository/TAccountRepositoryTest.java)

```java
public class TAccountRepositoryTest extends BaseTest {

    @Spy
    @InjectMocks
    private AccountRepository accountRepository;

    @Spy
    @InjectMocks
    private LockOnRedisManager lockOnRedisManager;

    @Mock
    private RedissonClient redissonClient;
    @Mock
    private RLock rLock;

    @Autowired
    private TAccountDAO tAccountDAO;
    @Autowired
    private TAccountFlowDAO tAccountFlowDAO;

    @Before
    public void stub(){
        String key = AccountRepository.LOCK_KEY_ACCOUNT_BALANCE + "1";
        try {
            Mockito.when(rLock.tryLock( 5, 5, TimeUnit.SECONDS)).thenReturn(true);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        Mockito.when(redissonClient.getLock(key)).thenReturn(rLock);

        ReflectionTestUtils.setField(accountRepository, "tAccountDAO", tAccountDAO);
        ReflectionTestUtils.setField(accountRepository, "tAccountFlowDAO", tAccountFlowDAO);
        int i = 3;
    }

    @Test
    public void testChangeUserAccountBalance(){
        Pair<Boolean, String> result = accountRepository.changeUserAccountBalance(1, "123", BigDecimal.valueOf(123));
        Assert.assertNotNull(result);
        Assert.assertTrue(result.getKey());
    }
}
```
## 2 外部的服务调用
同1.3章节，Mock + Stubbing即可实现该功能。


## 3 后续
时间管理，出个原理篇剖析mockito