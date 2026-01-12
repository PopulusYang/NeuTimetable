/**
 * @file NeuCourseTabel.cpp
 * @author PopulusYang
 * @brief NEU Course Table Parser and ICS Generator
 * @license MIT
 * @date 2026-01-12
 */

#include <ctime>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <regex>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

string
trim (string s)
{
  size_t first = s.find_first_not_of (" \n\r\t");
  if (string::npos == first)
    return "";
  size_t last = s.find_last_not_of (" \n\r\t");
  return s.substr (first, (last - first + 1));
}

string
clean (string s)
{
  string t = trim (s);
  string res;
  bool lastSpace = false;
  for (char c : t)
    {
      if (isspace (c))
        {
          if (!lastSpace)
            res += ' ';
          lastSpace = true;
        }
      else
        {
          res += c;
          lastSpace = false;
        }
    }
  return res;
}

struct Course
{
  string title;
  string location;
  string description;
  int day;
  int startPeriod;
  int endPeriod;
  vector<int> weeks;
};

// 解析周数逻辑：处理 1-12周, 9周, 11-13周(单/双) 等
vector<int>
parseWeeks (string s)
{
  vector<int> weeks;
  regex weekPartRegex ("([0-9\\-,]+)周(\\((单|双)\\))?");
  auto words_begin = sregex_iterator (s.begin (), s.end (), weekPartRegex);
  auto words_end = sregex_iterator ();

  for (sregex_iterator i = words_begin; i != words_end; ++i)
    {
      smatch match = *i;
      string rangeStr = match[1].str ();
      string type = match[3].str (); // "单" 或 "双" 或 ""

      stringstream ss (rangeStr);
      string segment;
      while (getline (ss, segment, ','))
        {
          segment = trim (segment);
          if (segment.empty ())
            continue;
          size_t dash = segment.find ('-');
          int start = 0, end = 0;
          try
            {
              if (dash != string::npos)
                {
                  string s1 = segment.substr (0, dash);
                  string s2 = segment.substr (dash + 1);
                  if (s1.empty () || s2.empty ())
                    continue;
                  start = stoi (s1);
                  end = stoi (s2);
                }
              else
                {
                  start = end = stoi (segment);
                }
            }
          catch (...)
            {
              continue;
            }

          for (int w = start; w <= end; ++w)
            {
              if (type == "单" && w % 2 == 0)
                continue;
              if (type == "双" && w % 2 != 0)
                continue;
              weeks.push_back (w);
            }
        }
    }
  if (weeks.empty ())
    for (int i = 1; i <= 16; ++i)
      weeks.push_back (i);
  return weeks;
}

// 位置
string
formatLocation (string s)
{
  size_t pos = s.find ("浑南校区");
  if (pos == string::npos)
    pos = s.find ("南湖校区");
  if (pos != string::npos)
    {
      return trim (s.substr (pos));
    }
  return trim (s);
}

string
addDays (string startDate, int days)
{
  struct tm tm = {};
  int y, m, d;
  char sep;
  stringstream ss (startDate);
  if (!(ss >> y >> sep >> m >> sep >> d))
    return "19700101";
  tm.tm_year = y - 1900;
  tm.tm_mon = m - 1;
  tm.tm_mday = d;
  tm.tm_isdst = -1;

  time_t t = mktime (&tm);
  t += (long long)days * 24 * 60 * 60;
  struct tm *newTm = localtime (&t);

  ostringstream oss;
  oss << setfill ('0') << setw (4) << (newTm->tm_year + 1900) << setw (2)
      << (newTm->tm_mon + 1) << setw (2) << newTm->tm_mday;
  return oss.str ();
}

string
getTime (int period, bool isStart)
{
  if (isStart)
    {
      switch (period)
        {
        case 1:
          return "083000";
        case 2:
          return "092500";
        case 3:
          return "103000";
        case 4:
          return "112500";
        case 5:
          return "140000";
        case 6:
          return "145500";
        case 7:
          return "160000";
        case 8:
          return "165500";
        case 9:
          return "183000";
        case 10:
          return "192500";
        case 11:
          return "203000";
        case 12:
          return "212500";
        default:
          return "000000";
        }
    }
  else
    {
      switch (period)
        {
        case 1:
          return "091500";
        case 2:
          return "101000";
        case 3:
          return "111500";
        case 4:
          return "121000";
        case 5:
          return "144500";
        case 6:
          return "154000";
        case 7:
          return "164500";
        case 8:
          return "174000";
        case 9:
          return "191500";
        case 10:
          return "201000";
        case 11:
          return "211500";
        case 12:
          return "221000";
        default:
          return "000000";
        }
    }
}

int
main (int argc, char *argv[])
{
  ifstream file ("exp.html"); // 打开抓取的 HTML 文件
  if (!file.is_open ())
    {
      cerr << "无法打开 exp.html" << endl;
      return 1; // 文件打开失败退出
    }
  string content ((istreambuf_iterator<char> (file)),
                  istreambuf_iterator<char> ()); // 读取全部内容
  file.close ();                                 // 关闭文件

  string colMark = "kbappTimetableDayColumnRoot"; // 定义每一列课表的标记
  vector<string> dayHtmls;                        // 存储每一天的 HTML 片段
  size_t lastPos = 0;                             // 上一次查找的位置
  while (true)
    {
      size_t pos = content.find (colMark, lastPos); // 查找列标记
      if (pos == string::npos)
        break;                                       // 找不到了则退出循环
      size_t startDiv = content.rfind ("<div", pos); // 向上寻找 div 的开始
      size_t nextPos = content.find (
          colMark, pos + colMark.length ()); // 查找下一个列标记
      if (nextPos == string::npos)
        {
          nextPos
              = content.find ("</div>\n", pos); // 若是最后一列，寻找闭合标签
          if (nextPos == string::npos)
            nextPos = content.length (); // 保守方案：截取到文件末尾
        }
      else
        {
          nextPos = content.rfind ("<div", nextPos); // 记录下一列 div 的起始
        }
      dayHtmls.push_back (
          content.substr (startDiv, nextPos - startDiv)); // 截取该天的数据
      lastPos = pos + colMark.length ();                  // 更新查找起点
      if (dayHtmls.size () == 7)
        break; // 抓够 7 天则强制退出
    }

  vector<Course> courses; // 存储解析出的课程列表
  for (int dayIndex = 0; dayIndex < (int)dayHtmls.size (); ++dayIndex)
    {
      string dayHtml = dayHtmls[dayIndex]; // 获取当天的 HTML
      regex slotRegex (
          "<div([^>]+style=\"[^\"]*flex:\\s*(\\d+)[^\"]*\"[^>]*)>"); // 匹配课程格子的
                                                                     // flex 值
      auto it = sregex_iterator (dayHtml.begin (), dayHtml.end (), slotRegex);
      auto end = sregex_iterator ();

      if (it != end)
        ++it; // 跳过最外层的列容器 div

      int currentPeriod = 1; // 当前节数计数器
      for (; it != end; ++it)
        {
          smatch m = *it;
          string attributes = m[1]; // 获取属性字符串
          int flex = stoi (m[2]);   // 提取 flex 值（代表占用的节数）
          bool isTopLevel = (attributes.find ("class=") == string::npos
                             || attributes.find (
                                    "kbappTimetableDayColumnConflictContainer")
                                    != string::npos); // 判断是否为顶层课程块
          if (!isTopLevel)
            continue; // 非顶层块则跳过

          if (attributes.find ("kbappTimetableDayColumnConflictContainer")
              != string::npos)
            {
              // ... 处理冲突或多课程情况 ...
              size_t startPos = m.position () + m.length ();
              size_t endPos = dayHtml.length ();
              auto nextIt = it;
              for (++nextIt; nextIt != end; ++nextIt)
                {
                  string nextAttr = (*nextIt)[1];
                  if (nextAttr.find ("class=") == string::npos
                      || nextAttr.find (
                             "kbappTimetableDayColumnConflictContainer")
                             != string::npos)
                    {
                      endPos = (*nextIt).position (); // 确定当前块的结束位置
                      break;
                    }
                }
              string innerHtml = dayHtml.substr (
                  startPos, endPos - startPos); // 提取内部 HTML

              regex titleRegex ("class=\"title[^\"]*\">\\s*([\\s\\S]+?)\\s*</"
                                "div>"); // 匹配课程标题
              auto titleIt = sregex_iterator (innerHtml.begin (),
                                              innerHtml.end (), titleRegex);
              auto titleEnd = sregex_iterator ();

              for (; titleIt != titleEnd; ++titleIt)
                {
                  smatch tm = *titleIt;
                  Course c;
                  c.day = dayIndex;                       // 记录星期
                  c.startPeriod = currentPeriod;          // 记录起始节数
                  c.endPeriod = currentPeriod + flex - 1; // 计算结束节数
                  c.title = clean (tm[1]);                // 提取并清理标题

                  size_t blockStart = tm.position () + tm.length ();
                  auto titleNext = titleIt;
                  ++titleNext;
                  size_t blockEnd = (titleNext == titleEnd)
                                        ? innerHtml.length ()
                                        : titleNext->position ();
                  string itemInfoHtml = innerHtml.substr (
                      blockStart, blockEnd - blockStart); // 提取详情块

                  regex infoRegex (
                      "class=\"kbappTimetableCourseRenderCourseItemInfoText["
                      "^\"]*\">\\s*([\\s\\S]+?)\\s*</div>"); // 匹配详情文字
                  auto infoIt = sregex_iterator (
                      itemInfoHtml.begin (), itemInfoHtml.end (), infoRegex);
                  bool firstInfo = true;
                  for (; infoIt != sregex_iterator (); ++infoIt)
                    {
                      string info = clean ((*infoIt)[1]); // 清理信息文字
                      if (info.empty ())
                        continue;
                      if (firstInfo)
                        {
                          c.weeks = parseWeeks (info);        // 解析周数
                          c.location = formatLocation (info); // 格式化地点
                          firstInfo = false;
                        }
                      else
                        {
                          if (!c.description.empty ())
                            c.description += " ";
                          c.description += info; // 拼接其他备注信息
                        }
                    }
                  if (!c.title.empty ())
                    {
                      courses.push_back (c); // 加入课程列表
                    }
                }
            }
          currentPeriod += flex; // 更新当前节数
        }
    }

  cout << "成功提取 " << courses.size () << " 门课程。" << endl;

  string startSunday;
  if (argc > 1)
    {
      startSunday = argv[1]; // 从命令行获取日期
      cout << "使用命令行参数日期: " << startSunday << endl;
    }
  else
    {
      cout << "请输入学期第一周周日的日期 (格式 YYYY-MM-DD): ";
      if (!(cin >> startSunday))
        startSunday = "2026-03-01"; // 默认备份日期
    }

  ofstream ics ("schedule.ics"); // 创建输出文件
  ics << "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//NEU Course Table//CN\n";
  int totalEvents = 0;
  for (const auto &c : courses)
    {
      for (int week : c.weeks)
        {
          string date
              = addDays (startSunday, c.day + (week - 1) * 7); // 计算具体日期
          string startTime = getTime (c.startPeriod, true);    // 获取起始时间
          string endTime = getTime (c.endPeriod, false);       // 获取结束时间
          ics << "BEGIN:VEVENT\n";
          ics << "SUMMARY:" << c.title << "\n";           // 写入标题
          ics << "LOCATION:" << c.location << "\n";       // 写入地点
          ics << "DESCRIPTION:" << c.description << "\n"; // 写入详情
          ics << "DTSTART:" << date << "T" << startTime
              << "\n";                                       // 写入开始时间
          ics << "DTEND:" << date << "T" << endTime << "\n"; // 写入结束时间
          ics << "END:VEVENT\n";
          totalEvents++; // 计数
        }
    }
  ics << "END:VCALENDAR\n";
  ics.close (); // 关闭文件
  cout << "生成完成，保存在 schedule.ics" << endl;

  return 0;
}
