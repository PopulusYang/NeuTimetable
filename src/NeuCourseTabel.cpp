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
  string weekStr; // 新增：原始周数信息
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
      regex slotRegex ("<div([^>]+style=\"[^\"]*flex:\\s*(\\d+)[^\"]*\"[^>]*)"
                       ">"); // 匹配课程格子的
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
          bool isTopLevel
              = (attributes.find ("class=") == string::npos
                 || attributes.find ("kbappTimetableDayColumn")
                        != string::
                            npos); // 判断是否为顶层课程块（包含冲突容器和普通课程块）
          if (!isTopLevel)
            continue; // 非顶层块则跳过

          // 提取当前块内部的 HTML 内容
          size_t startPos = m.position () + m.length ();
          size_t endPos = dayHtml.length ();
          auto nextIt = it;
          for (++nextIt; nextIt != end; ++nextIt)
            {
              string nextAttr = (*nextIt)[1];
              if (nextAttr.find ("class=") == string::npos
                  || nextAttr.find ("kbappTimetableDayColumn") != string::npos)
                {
                  endPos = (*nextIt).position (); // 确定当前块的结束位置
                  break;
                }
            }
          string innerHtml = dayHtml.substr (startPos, endPos - startPos);

          regex titleRegex ("class=\"title[^\"]*\">\\s*([\\s\\S]+?)\\s*</"
                            "div>"); // 匹配课程标题
          auto titleIt = sregex_iterator (innerHtml.begin (), innerHtml.end (),
                                          titleRegex);
          auto titleEnd = sregex_iterator ();

          for (; titleIt != titleEnd; ++titleIt)
            {
              smatch tm = *titleIt;
              Course c;
              c.day = dayIndex;                       // 记录星期
              c.startPeriod = currentPeriod;          // 记录起始节数
              c.endPeriod = currentPeriod + flex - 1; // 计算结束节数
              c.title = clean (tm[1]);                // 提取并清理标题

              // 过滤掉非课程的页面干扰项
              if (c.title == "我的应用" || c.title == "公告消息情况"
                  || c.title == "学习日程"
                  || c.title.find ("2026-") != string::npos)
                continue;

              size_t blockStart = tm.position () + tm.length ();
              auto titleNext = titleIt;
              ++titleNext;
              size_t blockEnd = (titleNext == titleEnd)
                                    ? innerHtml.length ()
                                    : titleNext->position ();
              string itemInfoHtml
                  = innerHtml.substr (blockStart, blockEnd - blockStart);

              regex infoRegex (
                  "class=\"kbappTimetableCourseRenderCourseItemInfoText["
                  "^\"]*\">\\s*([\\s\\S]+?)\\s*</div>"); // 匹配详情文字
              auto infoIt = sregex_iterator (itemInfoHtml.begin (),
                                             itemInfoHtml.end (), infoRegex);
              bool firstInfo = true;
              for (; infoIt != sregex_iterator (); ++infoIt)
                {
                  string info = clean ((*infoIt)[1]); // 清理信息文字
                  if (info.empty ())
                    continue;
                  if (firstInfo)
                    {
                      // 1. 提取周数部分
                      regex weekRegex ("([0-9\\-,]+周(\\((单|双)\\))?)");
                      smatch wmatch;
                      if (regex_search (info, wmatch, weekRegex))
                        c.weekStr = wmatch.str ();
                      else
                        c.weekStr = "";

                      c.weeks = parseWeeks (info);        // 解析周数数组
                      c.location = formatLocation (info); // 提取地点

                      // 2. 提取教师姓名
                      // (从第一行中剔除周数和地点关键字后的部分)
                      string teacher = info;
                      if (!c.weekStr.empty ())
                        {
                          size_t wpos = teacher.find (c.weekStr);
                          if (wpos != string::npos)
                            teacher.erase (wpos, c.weekStr.length ());
                        }
                      size_t locKeyPos = teacher.find ("浑南校区");
                      if (locKeyPos == string::npos)
                        locKeyPos = teacher.find ("南湖校区");
                      if (locKeyPos != string::npos)
                        {
                          teacher.erase (locKeyPos);
                        }
                      else if (!c.location.empty ())
                        {
                          size_t lpos = teacher.find (c.location);
                          if (lpos != string::npos)
                            teacher.erase (lpos, c.location.length ());
                        }
                      teacher = clean (teacher);
                      if (!teacher.empty ())
                        {
                          if (!c.description.empty ())
                            c.description += ",";
                          c.description += teacher;
                        }

                      firstInfo = false;
                    }
                  else
                    {
                      if (!c.description.empty ())
                        c.description += ",";
                      c.description += info; // 拼接其他信息（通常是教师）
                    }
                }
              if (!c.title.empty ())
                {
                  courses.push_back (c); // 加入课程列表
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

  // 生成旧版样式的 HTML 课表
  ofstream html ("exp_old.html");
  html << "<!DOCTYPE html><html><head><meta charset='utf-8'><title>我的课表 "
          "(旧系统样式)</title>"
       << "<style>"
       << "body { font-family: 'Microsoft YaHei', sans-serif; "
          "background-color: #f5f5f5; }"
       << "table { border-collapse: collapse; width: 100%; border: 1px solid "
          "#000; background: white; table-layout: fixed; }"
       << "th, td { border: 1px solid #000; text-align: center; padding: 4px; "
          "overflow: hidden; }"
       << "th { background-color: #DEEDF7; font-size: 13px; height: 30px; }"
       << ".infoTitle { background-color: #94aef3; font-size: 11px; "
          "transition: background 0.3s; }"
       << ".infoTitle:hover { background-color: #7a9ce0; }"
       << ".period-label { background-color: #EEFF00; font-weight: bold; "
          "width: 60px; font-size: 12px; }"
       << ".course-box { text-align: left; padding: 2px; }"
       << "hr { border: 0; border-top: 1px dashed #555; margin: 4px 0; }"
       << "</style></head><body>"
       << "<div style='text-align:center; margin: 10px; font-size: "
          "14px;'><b>东北大学 课程表 (旧系统样式预览)</b><br>"
       << "<span style='font-size: 12px;'>格式说明：课程名称 (教师) / (周数, "
          "教室)</span></div>"
       << "<table><thead><tr><th "
          "style='width:60px;'>节次/周次</th><th>星期日</th><th>星期一</"
          "th><th>星期二</th><th>星期三</th><th>星期四</th><th>星期五</"
          "th><th>星期六</th></tr></thead><tbody>";

  vector<Course *> cgrid[13][7];
  for (auto &c : courses)
    {
      if (c.day >= 0 && c.day < 7 && c.startPeriod >= 1 && c.startPeriod <= 12)
        cgrid[c.startPeriod][c.day].push_back (&c);
    }

  bool occupied[13][7] = { false };
  const char *periodNames[]
      = { "",       "第一节",   "第二节",  "第三节", "第四节",
          "第五节", "第六节",   "第七节",  "第八节", "第九节",
          "第十节", "第十一节", "第十二节" };

  for (int p = 1; p <= 12; ++p)
    {
      html << "<tr>";
      html << "<td class='period-label'>" << periodNames[p] << "</td>";

      for (int d = 0; d < 7; ++d)
        {
          if (occupied[p][d])
            continue;

          if (cgrid[p][d].empty ())
            {
              html << "<td></td>";
              continue;
            }

          int maxEnd = p;
          for (auto *cptr : cgrid[p][d])
            {
              if (cptr->endPeriod > maxEnd)
                maxEnd = cptr->endPeriod;
            }
          if (maxEnd > 12)
            maxEnd = 12;

          int rowspan = maxEnd - p + 1;
          html << "<td class='infoTitle' rowspan='" << rowspan << "'>";
          html << "<div class='course-box'>";

          for (size_t i = 0; i < cgrid[p][d].size (); ++i)
            {
              Course *cptr = cgrid[p][d][i];
              html << "<b>" << cptr->title << "</b> (" << cptr->description
                   << ")";
              html << "<br>(" << cptr->weekStr << ", " << cptr->location
                   << ")";
              if (i < cgrid[p][d].size () - 1)
                html << "<hr>";
            }

          html << "</div></td>";

          for (int r = p; r <= maxEnd; ++r)
            occupied[r][d] = true;
        }
      html << "</tr>";
    }

  html << "</tbody></table></body></html>";
  html.close ();
  cout << "旧版 HTML 预览已完成格式优化: exp_old.html" << endl;

  return 0;
}
