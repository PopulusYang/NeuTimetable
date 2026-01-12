cmake_minimum_required(VERSION 3.10)
project(NeuCourseTable)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 强制静态链接，确保在没有安装 MinGW 的电脑上也能运行
if(MINGW)
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -static -static-libgcc -static-libstdc++")
endif()

# 1. 编译后端解析库/程序
add_executable(NeuCourseTabel src/NeuCourseTabel.cpp)

# 2. 编译窗口程序 (仅 Windows)
if(WIN32)
    add_executable(CourseTableApp WIN32 src/CourseTableGUI.cpp)
    target_compile_definitions(CourseTableApp PRIVATE UNICODE _UNICODE)

    # MinGW 需要额外的链接参数来支持 wWinMain
    if(MINGW)
        set_target_properties(CourseTableApp PROPERTIES LINK_FLAGS "-municode")
    endif()

    # 链接 Windows 必要库
    target_link_libraries(CourseTableApp PRIVATE shell32 user32 gdi32)
endif()

# 设置输出目录
set_target_properties(NeuCourseTabel PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")
if(WIN32)
    set_target_properties(CourseTableApp PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")
endif()

# 复制脚本和启动项到输出目录
if(WIN32)
    add_custom_command(TARGET CourseTableApp POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_SOURCE_DIR}/src/neuscraper_ui.py"
            "${CMAKE_BINARY_DIR}/bin/neuscraper_ui.py"
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_SOURCE_DIR}/RunApp.bat"
            "${CMAKE_BINARY_DIR}/bin/RunApp.bat"
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_SOURCE_DIR}/requirements.txt"
            "${CMAKE_BINARY_DIR}/bin/requirements.txt"
        COMMENT "Copying scraper script and deployment files to bin folder"
    )
else()
    # Linux/Mac 平台的后续操作可以在这里定义，例如赋予执行权限等
    add_custom_command(TARGET NeuCourseTabel POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_SOURCE_DIR}/src/neuscraper_ui.py"
            "${CMAKE_BINARY_DIR}/bin/neuscraper_ui.py"
        COMMENT "Copying scraper script to bin folder"
    )
endif()
