---
name: flet-api-reference
description: Flet Python GUI framework API reference. MUST read this before writing or modifying any Flet code in index.py or any .py file that uses flet. Contains tested-and-proven safe APIs vs known broken APIs for this project's Flet version.
---

# Flet API Reference for This Project

> **CRITICAL RULE**: Before writing ANY Flet code, check this document first.
> This project uses an older version of Flet where many "convenience" APIs do NOT exist.
> Always use the **SAFE** patterns listed below. NEVER use the **BROKEN** patterns.

---

## BROKEN APIs (DO NOT USE - Will crash the app)

These have been tested and confirmed to cause `AttributeError` or similar crashes:

| ❌ BROKEN Code | Error Message |
|---|---|
| `ft.border.all(width, color)` | `module 'flet.controls.border' has no attribute 'all'` |
| `ft.alignment.center` | `module 'flet.controls.alignment' has no attribute 'center'` |
| `ft.icons.PERSON` | `module 'flet.controls.material.icons' has no attribute 'PERSON'` |
| `ft.Icons.PERSON` | Same as above |
| `ft.MainAxisSize` | `module 'flet' has no attribute 'MainAxisSize'` |
| `Row(main_axis_size=...)` | `Row.__init__() got an unexpected keyword argument 'main_axis_size'` |
| `ft.Icon(name="person")` | `Icon.__init__() got an unexpected keyword argument 'name'` |
| `page.session.set(...)` | `'Session' object has no attribute 'set'` |
| `page.client_storage.set(...)` | `'Page' object has no attribute 'client_storage'` |
| `ft.Text(..., no_wrap=True)` | May cause unexpected keyword argument error |

---

## SAFE APIs (Tested and confirmed working)

### Border (เส้นขอบ)

**ALWAYS use `ft.Border` with `ft.BorderSide` explicitly for all 4 sides:**

```python
# ✅ SAFE - explicit 4-side border
border=ft.Border(
    top=ft.BorderSide(4, "white"),
    bottom=ft.BorderSide(4, "white"),
    left=ft.BorderSide(4, "white"),
    right=ft.BorderSide(4, "white")
)
```

**If you need a helper function for convenience, define it locally:**

```python
def b_all(width, color):
    return ft.Border(
        top=ft.BorderSide(width, color),
        bottom=ft.BorderSide(width, color),
        left=ft.BorderSide(width, color),
        right=ft.BorderSide(width, color)
    )

# Usage:
border=b_all(4, "white")
```

### Alignment (การจัดตำแหน่ง)

```python
# ✅ SAFE - use ft.Alignment(x, y) with float coordinates
alignment=ft.Alignment(0, 0)      # Center
alignment=ft.Alignment(-1, 0)     # Center-left
alignment=ft.Alignment(1, 0)      # Center-right
alignment=ft.Alignment(0, -1)     # Top-center
alignment=ft.Alignment(0, 1)      # Bottom-center
alignment=ft.Alignment(-1, -1)    # Top-left
alignment=ft.Alignment(1, 1)      # Bottom-right
```

### Row (แถวแนวนอน)

```python
# ✅ SAFE
ft.Row(
    [control1, control2],
    alignment="center",          # or ft.MainAxisAlignment.CENTER
    spacing=10,
)
```

**IMPORTANT**: Row will expand horizontally to fill available space by default.
To prevent Row from expanding, either:
1. Put it inside a Container with a fixed `width`
2. Use only `ft.Text` directly instead of Row when possible (simpler and safer)

### Column (คอลัมน์แนวตั้ง)

```python
# ✅ SAFE
ft.Column(
    [control1, control2],
    alignment="center",
    spacing=10,
)
```

### Container (กล่อง)

```python
# ✅ SAFE - The most reliable pattern
ft.Container(
    content=ft.Text("Hello", size=36, color="white", weight="bold"),
    bgcolor="#727272",
    border=ft.Border(
        top=ft.BorderSide(4, "white"),
        bottom=ft.BorderSide(4, "white"),
        left=ft.BorderSide(4, "white"),
        right=ft.BorderSide(4, "white")
    ),
    border_radius=30,
    padding=ft.Padding(left=40, right=40, top=20, bottom=20),
    width=500,          # Optional fixed width
    height=100,         # Optional fixed height
    alignment=ft.Alignment(0, 0),  # Center content
    top=90, right=96,   # Position in Stack
    on_click=handler,   # Optional click handler
)
```

### Text (ข้อความ)

```python
# ✅ SAFE
ft.Text(
    value="Hello",      # or positional: ft.Text("Hello")
    size=36,
    color="white",
    weight="bold",      # "bold", "normal", "w100"-"w900"
    text_align="center",
)
```

### Icon (ไอคอน)

```python
# ✅ SAFE - positional argument only, NO name= keyword
ft.Icon("person", color="white", size=36)
ft.Icon("phone", size=40, color="grey")
ft.Icon("lock", size=40, color="grey")
ft.Icon("settings", size=40, color="grey")
```

### Image (รูปภาพ)

```python
# ✅ SAFE
ft.Image(src="filename.png", width=80, height=80)
ft.Image(src="qr-code.jpg", width=600, height=600, fit="contain")
```

### Stack (ซ้อนหลาย control ทับกัน)

```python
# ✅ SAFE
ft.Stack(
    [bg_container, text_overlay, button],
    width=1920,
    height=1080,
)
# Position children using top, bottom, left, right on each child
```

### SnackBar (แจ้งเตือน)

```python
# ✅ SAFE
page.snack_bar = ft.SnackBar(
    ft.Text("ข้อความแจ้งเตือน", size=30),
    bgcolor="red"
)
page.snack_bar.open = True
page.update()
```

### Page (หน้าจอหลัก)

```python
# ✅ SAFE
page.title = "App Title"
page.window.width = 1920
page.window.height = 1080
page.padding = 0
page.bgcolor = "white"
page.theme_mode = "light"
page.window.resizable = False
page.controls.clear()       # Clear all controls
page.add(control)           # Add control
page.update()               # Refresh UI
```

### Storing Data (เก็บข้อมูลระหว่างหน้า)

```python
# ✅ SAFE - use direct Python attribute assignment
page.user_token = token
page.member_data = user_data
page.staff_token = res_data['token']

# Read back with hasattr check
if hasattr(page, 'member_data'):
    fname = page.member_data['fname']
```

### Running the App

```python
# ✅ SAFE - compatible startup
if __name__ == "__main__":
    if hasattr(ft, "run"):
        ft.run(main, assets_dir="assets")
    else:
        try:
            ft.app(target=main, assets_dir="assets")
        except AttributeError:
            ft.app(main, assets_dir="assets")
```

---

## Golden Rule: When in Doubt, Keep It Simple

The proven pattern that NEVER fails in this project:

```python
# Container + Text = always works
ft.Container(
    content=ft.Text("ข้อความ", size=54, color="white", weight="bold"),
    bgcolor="#5CB85C",
    border=ft.Border(
        top=ft.BorderSide(6, "white"),
        bottom=ft.BorderSide(6, "white"),
        left=ft.BorderSide(6, "white"),
        right=ft.BorderSide(6, "white")
    ),
    border_radius=25,
    padding=ft.Padding(left=50, right=50, top=20, bottom=20),
)
```

If you need Icon + Text together, put them in a Row INSIDE a Container with fixed width:

```python
ft.Container(
    content=ft.Row(
        [ft.Icon("person", color="white", size=36), ft.Text("Name", size=36, color="white")],
        spacing=10,
    ),
    bgcolor="#727272",
    width=500,  # MUST fix width to prevent Row from expanding infinitely
    height=100,
    # ... border, padding etc.
)
```

---

## Official Flet Docs Reference

For the latest API documentation, refer to: https://flet.dev/docs

Key pages:
- Controls: https://flet.dev/docs/controls/container
- Border: https://flet.dev/docs/reference/types/border
- Alignment: https://flet.dev/docs/reference/types/alignment
- Row: https://flet.dev/docs/controls/row
- Column: https://flet.dev/docs/controls/column
- Text: https://flet.dev/docs/controls/text
- Icon: https://flet.dev/docs/controls/icon
- Stack: https://flet.dev/docs/controls/stack
- Page: https://flet.dev/docs/controls/page
- SnackBar: https://flet.dev/docs/controls/snackbar
