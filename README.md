# 东北大学新教务系统课表导出工具

这是一个用于将东北大学教务系统课表导出为日历文件 (.ics) 的工具。


### 编译说明
#### Windows
请确保已安装 CMake 和 C++ 编译器 (如 MinGW-w64)，运行：
```bash
cd build                                                                                                      
cmake .. -G "MinGW Makefiles"
cmake --build .
./build_dist.bat
```

#### Linux / macOS
（兼容版用ai生的没有测试不一定好使）
请使用以下命令编译并启动：
```bash
chmod +x RunApp.sh
./RunApp.sh
```

### 使用方法
1. **Windows**: 直接运行 `CourseTableApp.exe`。
2. **Linux/macOS**: 运行 `./RunApp.sh`。
3. 在弹出的 GUI 窗口中点击“登录并抓取”。
4. 登录后滚动到底，点击“我的课表”，点击课表右上角的“学期课表”，再点击页面左上角抓取课表按钮即可。
5. 返回工具界面，输入开学第一周周日的日期，生成日历文件 `.ics` 文件。
6. 点击“开启共享”，同一网络环境下可以访问http://[ip地址]:8080/eams/courseTableForStd.action，用于如超级课程表等App自动导入功能。

#### 此程序针对东北大学新版教务系统（2026年1月12日）[jwxt.neu.edu.cn](jwxt.neu.edu.cn)

#### 新教务系统正在更新，该方法可能失效。失效了我也没辙。感谢理解
