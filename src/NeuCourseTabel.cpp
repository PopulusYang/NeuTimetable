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

//位置
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
  ifstream file ("exp.html");
  if (!file.is_open ())
    {
      cerr << "无法打开 exp.html" << endl;
      return 1;
    }
  string content ((istreambuf_iterator<char> (file)),
                  istreambuf_iterator<char> ());
  file.close ();

  string colMark = "kbappTimetableDayColumnRoot";
  vector<string> dayHtmls;
  size_t lastPos = 0;
  while (true)
    {
      size_t pos = content.find (colMark, lastPos);
      if (pos == string::npos)
        break;
      size_t startDiv = content.rfind ("<div", pos);
      size_t nextPos = content.find (colMark, pos + colMark.length ());
      if (nextPos == string::npos)
        {
          nextPos = content.find ("</div>\n", pos);
          if (nextPos == string::npos)
            nextPos = content.length ();
        }
      else
        {
          nextPos = content.rfind ("<div", nextPos);
        }
      dayHtmls.push_back (content.substr (startDiv, nextPos - startDiv));
      lastPos = pos + colMark.length ();
      if (dayHtmls.size () == 7)
        break;
    }

  vector<Course> courses;
  for (int dayIndex = 0; dayIndex < (int)dayHtmls.size (); ++dayIndex)
    {
      string dayHtml = dayHtmls[dayIndex];
      regex slotRegex (
          "<div([^>]+style=\"[^\"]*flex:\\s*(\\d+)[^\"]*\"[^>]*)>");
      auto it = sregex_iterator (dayHtml.begin (), dayHtml.end (), slotRegex);
      auto end = sregex_iterator ();

      if (it != end)
        ++it; // Skip column div

      int currentPeriod = 1;
      for (; it != end; ++it)
        {
          smatch m = *it;
          string attributes = m[1];
          int flex = stoi (m[2]);
          bool isTopLevel = (attributes.find ("class=") == string::npos
                             || attributes.find (
                                    "kbappTimetableDayColumnConflictContainer")
                                    != string::npos);
          if (!isTopLevel)
            continue;

          if (attributes.find ("kbappTimetableDayColumnConflictContainer")
              != string::npos)
            {
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
                      endPos = (*nextIt).position ();
                      break;
                    }
                }
              string innerHtml = dayHtml.substr (startPos, endPos - startPos);

              // 查找该格子内所有的标题，并以标题为起始拆分课程块
              regex titleRegex (
                  "class=\"title[^\"]*\">\\s*([\\s\\S]+?)\\s*</div>");
              auto titleIt = sregex_iterator (innerHtml.begin (),
                                              innerHtml.end (), titleRegex);
              auto titleEnd = sregex_iterator ();

              for (; titleIt != titleEnd; ++titleIt)
                {
                  smatch tm = *titleIt;
                  Course c;
                  c.day = dayIndex;
                  c.startPeriod = currentPeriod;
                  c.endPeriod = currentPeriod + flex - 1;
                  c.title = clean (tm[1]);

                  // 提取该标题后的相关信息，直到下一个标题出现或块结束
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
                      "^\"]*\">\\s*([\\s\\S]+?)\\s*</div>");
                  auto infoIt = sregex_iterator (
                      itemInfoHtml.begin (), itemInfoHtml.end (), infoRegex);
                  bool firstInfo = true;
                  for (; infoIt != sregex_iterator (); ++infoIt)
                    {
                      string info = clean ((*infoIt)[1]);
                      if (info.empty ())
                        continue;
                      if (firstInfo)
                        {
                          c.weeks = parseWeeks (info);
                          c.location = formatLocation (info);
                          firstInfo = false;
                        }
                      else
                        {
                          if (!c.description.empty ())
                            c.description += " ";
                          c.description += info;
                        }
                    }
                  if (!c.title.empty ())
                    {
                      courses.push_back (c);
                    }
                }
            }
          currentPeriod += flex;
        }
    }

  cout << "成功提取 " << courses.size () << " 门课程。" << endl;
  for (const auto &c : courses)
    {
      cout << "[" << c.day << "] " << c.title << " @ " << c.location << " ("
           << c.startPeriod << "-" << c.endPeriod << "节)" << endl;
    }

  string startSunday;
  if (argc > 1)
    {
      startSunday = argv[1];
      cout << "使用命令行参数日期: " << startSunday << endl;
    }
  else
    {
      cout << "请输入学期第一周周日的日期 (格式 YYYY-MM-DD): ";
      if (!(cin >> startSunday))
        startSunday = "2026-03-01";
    }

  ofstream ics ("schedule.ics");
  ics << "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//NEU Course Table//CN\n";
  int totalEvents = 0;
  for (const auto &c : courses)
    {
      for (int week : c.weeks)
        {
          string date = addDays (startSunday, c.day + (week - 1) * 7);
          string startTime = getTime (c.startPeriod, true);
          string endTime = getTime (c.endPeriod, false);
          ics << "BEGIN:VEVENT\n";
          ics << "SUMMARY:" << c.title << "\n";
          ics << "LOCATION:" << c.location << "\n";
          ics << "DESCRIPTION:" << c.description << "\n";
          ics << "DTSTART:" << date << "T" << startTime << "\n";
          ics << "DTEND:" << date << "T" << endTime << "\n";
          ics << "END:VEVENT\n";
          totalEvents++;
        }
    }
  ics << "END:VCALENDAR\n";
  ics.close ();
  cout << "已为 " << courses.size () << " 门课生成了 " << totalEvents
       << " 个独立日程节点，保存在 schedule.ics" << endl;

  return 0;
}
