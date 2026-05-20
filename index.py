import flet as ft

def main(page: ft.Page):
    # ตั้งค่าหน้าต่างโปรแกรมหลัก
    page.title = "Transform Waste into Renewable Trust"
    page.window.width = 1920
    page.window.height = 1080
    page.padding = 0
    page.bgcolor = "white"
    page.theme_mode = "light"
    page.window.resizable = False

    # ฟังก์ชันสร้างพื้นหลังสีเขียวเอียง
    def get_bg_green():
        return ft.Container(
            bgcolor="#61B964",
            width=3600,
            height=1800,
            rotate=-0.05,
            left=-240,
            top=405,
        )
        
    # ฟังก์ชันสร้างปุ่มย้อนกลับ (ใช้รูปภาพ)
    def get_back_btn(on_click_action):
        return ft.Container(
            content=ft.Image(src="back.png", width=80, height=80),
            bottom=45, left=96,
            on_click=on_click_action
        )

    # -------------------------------------------------------------------
    # หน้าแรก (Home) - สำหรับกรอกหมายเลขสมาชิก
    # -------------------------------------------------------------------
    def show_home(e=None):
        page.controls.clear()
        
        # พื้นหลัง
        bg_green = get_bg_green()

        # ข้อความหัวข้อ
        title_text = ft.Container(
            content=ft.Text(
                "โปรดกรอก\nหมายเลขสมาชิก", 
                size=68, 
                color="#0E9F14",
                weight="bold",
                text_align="left"
            ),
            left=96, top=90
        )

        # ตัวแปรเก็บหมายเลขสมาชิกที่กรอก
        member_number = ft.Text(value="", size=54, color="black", weight="bold", text_align="center")

        # ฟังก์ชันเมื่อกดตัวเลข
        def num_click(e):
            if len(member_number.value) < 10:
                member_number.value += e.control.data
                member_number.update()
                
        # ฟังก์ชันเมื่อกดลบ
        def backspace_click(e):
            if len(member_number.value) > 0:
                member_number.value = member_number.value[:-1]
                member_number.update()
                
        # ฟังก์ชันเมื่อกดยืนยันหมายเลข
        def submit_click(e):
            if member_number.value:
                print(f"Submit member: {member_number.value}")
                show_action_menu(e)

        # ฟังก์ชันสร้างปุ่มตัวเลขบนแป้นพิมพ์
        def create_btn(text, on_click, bg_color="#E0E0E0", text_color="black"):
            return ft.Container(
                content=ft.Text(text, size=60, color=text_color, weight="bold"),
                bgcolor=bg_color,
                width=140, height=140,
                border_radius=70,
                alignment=ft.Alignment(0, 0),
                on_click=on_click,
                data=text
            )

        # UI แป้นพิมพ์ตัวเลข (Keypad)
        keypad = ft.Container(
            content=ft.Column([
                # ช่องแสดงตัวเลขที่กรอก
                ft.Container(
                    content=member_number,
                    width=600, height=120,
                    bgcolor="white",
                    border=ft.Border(
                        top=ft.BorderSide(4, "#A0A0A0"),
                        bottom=ft.BorderSide(4, "#A0A0A0"),
                        left=ft.BorderSide(4, "#A0A0A0"),
                        right=ft.BorderSide(4, "#A0A0A0")
                    ),
                    border_radius=20,
                    alignment=ft.Alignment(0, 0)
                ),
                # ปุ่ม 1-9 และ 0
                ft.Row([create_btn("1", num_click), create_btn("2", num_click), create_btn("3", num_click)], alignment="center", spacing=35),
                ft.Row([create_btn("4", num_click), create_btn("5", num_click), create_btn("6", num_click)], alignment="center", spacing=35),
                ft.Row([create_btn("7", num_click), create_btn("8", num_click), create_btn("9", num_click)], alignment="center", spacing=35),
                ft.Row([
                    ft.Container(bgcolor="#FF4D4D", width=140, height=140, border_radius=70, on_click=backspace_click), 
                    create_btn("0", num_click), 
                    ft.Container(bgcolor="#5CB85C", width=140, height=140, border_radius=70, on_click=submit_click), 
                ], alignment="center", spacing=35),
            ], spacing=25, alignment="center"),
            bgcolor="white",
            padding=ft.Padding(left=40, right=40, top=40, bottom=40),
            border_radius=40,
            border=ft.Border(
                top=ft.BorderSide(20, "#E8F5E9"),
                bottom=ft.BorderSide(20, "#E8F5E9"),
                left=ft.BorderSide(20, "#E8F5E9"),
                right=ft.BorderSide(20, "#E8F5E9")
            ),
            top=60, left=750, width=720
        )

        # ปุ่มสมัครสมาชิก
        register_btn = ft.Container(
            content=ft.Text("สมัครสมาชิก", size=54, color="white", weight="bold"),
            bgcolor="#5CB85C",
            border=ft.Border(
                top=ft.BorderSide(6, "white"),
                bottom=ft.BorderSide(6, "white"),
                left=ft.BorderSide(6, "white"),
                right=ft.BorderSide(6, "white")
            ),
            border_radius=25,
            padding=ft.Padding(left=50, right=50, top=20, bottom=20),
            bottom=90, right=96,
            on_click=lambda e: show_register(e)
        )

        # ปุ่มมุมซ้ายล่างสำหรับเจ้าหน้าที่
        staff_only = ft.Container(
            content=ft.Row(
                [
                    ft.Image(src="settings.png", width=80, height=80), 
                    ft.Text("*Staff Only*", size=40, color="red", weight="bold"),
                ],
                spacing=12,
            ),
            left=48,
            bottom=110,
            on_click=lambda e: show_staff_login(e)
        )

        # รวม UI ทั้งหมดของหน้าแรก
        home_stack = ft.Stack([bg_green, title_text, keypad, register_btn, staff_only], width=1920, height=1080)
        
        page.add(home_stack)
        page.update()

    # -------------------------------------------------------------------
    # หน้าเมนูหลัก (Action Menu) - แสดงหลังจากกรอกหมายเลขสมาชิกสำเร็จ
    # -------------------------------------------------------------------
    def show_action_menu(e=None):
        page.controls.clear()
        
        # พื้นหลังสีเขียวเต็มจอ
        bg_full_green = ft.Container(
            bgcolor="#61B964",
            width=1920,
            height=1080,
            left=0, top=0
        )

        # แถบสีขาวเอียงด้านล่าง
        bg_white_stripe = ft.Container(
            bgcolor="white",
            width=3600,
            height=1800,
            rotate=-0.05,
            left=-240,
            top=405,
        )

        # ข้อความหัวข้อหลัก
        title = ft.Container(
            content=ft.Column(
                [
                    ft.Text("Transform Waste into", size=80, color="white", weight="w600"),
                    ft.Text("Renewable Trust", size=80, color="#E8F5E9", weight="w600"),
                ],
                spacing=0,
            ),
            left=96,
            top=90,
        )

        # ฟังก์ชันสร้างปุ่มเมนูขนาดใหญ่
        def modern_button(text, top_pos, on_click):
            return ft.Container(
                content=ft.Text(text, size=60, color="white", weight="w500"),
                bgcolor="#5CB85C",
                border=ft.Border(
                    top=ft.BorderSide(6, "white"),
                    bottom=ft.BorderSide(6, "white"),
                    left=ft.BorderSide(6, "white"),
                    right=ft.BorderSide(6, "white")
                ),
                border_radius=30,
                padding=ft.Padding(left=70, right=70, top=35, bottom=35),
                alignment=ft.Alignment(0, 0),
                width=840,
                top=top_pos,
                right=96,
                on_click=on_click
            )

        # ปุ่มสะสมแต้ม และ รับคูปองเงินสด
        btn_points = modern_button("สะสมแต้มสมาชิก", 300, lambda _: print("Clicked: สะสมแต้มสมาชิก"))
        btn_coupon = modern_button("รับคูปองเงินสด", 520, lambda _: print("Clicked: รับคูปองเงินสด"))

        # ปุ่มย้อนกลับ
        back_btn = get_back_btn(show_home)

        # รวม UI ทั้งหมดของหน้าเมนูหลัก
        action_stack = ft.Stack([bg_full_green, bg_white_stripe, title, btn_points, btn_coupon, back_btn], width=1920, height=1080)
        page.add(action_stack)
        page.update()

    # -------------------------------------------------------------------
    # หน้าเข้าสู่ระบบเจ้าหน้าที่ (Staff Login)
    # -------------------------------------------------------------------
    def show_staff_login(e=None):
        page.controls.clear()
        
        # แถบสีเขียวด้านบน
        top_banner = ft.Container(
            bgcolor="#5CB85C",
            width=1920,
            height=290,
            top=0, left=0
        )
        
        # ป้ายข้อความ LOGIN
        login_label = ft.Container(
            content=ft.Text("LOGIN", size=72, color="white", weight="bold"),
            border=ft.Border(
                top=ft.BorderSide(6, "white"),
                bottom=ft.BorderSide(6, "white"),
                left=ft.BorderSide(6, "white"),
                right=ft.BorderSide(6, "white")
            ),
            border_radius=20,
            padding=ft.Padding(left=50, right=50, top=20, bottom=20),
            left=96, top=70
        )
        
        # ตัวแปรเก็บรหัสพนักงาน
        staff_number = ft.Text(value="", size=72, color="black", weight="bold")
        
        # ช่องแสดงรหัสพนักงาน
        input_field = ft.Container(
            content=staff_number,
            bgcolor="white",
            width=1200,
            height=150,
            border_radius=20,
            padding=ft.Padding(left=40, right=40, top=20, bottom=20),
            alignment=ft.Alignment(-1, 0), 
            left=550, top=70
        )
        
        # ฟังก์ชันเมื่อกดตัวเลข
        def num_click(e):
            if len(staff_number.value) < 10:
                staff_number.value += e.control.data
                staff_number.update()
                
        # ฟังก์ชันเมื่อกดลบ
        def backspace_click(e):
            if len(staff_number.value) > 0:
                staff_number.value = staff_number.value[:-1]
                staff_number.update()
                
        # ฟังก์ชันเมื่อกดยืนยันรหัสผ่านพนักงาน
        def submit_click(e):
            if staff_number.value:
                print(f"Login staff: {staff_number.value}")
                show_staff_dashboard(e)
            
        # ฟังก์ชันสร้างปุ่มแป้นพิมพ์
        def create_btn(text, on_click, bg_color="#E0E0E0", text_color="black"):
            return ft.Container(
                content=ft.Text(text, size=60, color=text_color, weight="bold"),
                bgcolor=bg_color,
                width=150, height=150,
                border_radius=75,
                alignment=ft.Alignment(0, 0),
                on_click=on_click,
                data=text
            )

        # UI แป้นพิมพ์ตัวเลข
        keypad = ft.Container(
            content=ft.Column([
                ft.Row([create_btn("1", num_click), create_btn("2", num_click), create_btn("3", num_click)], alignment="center", spacing=50),
                ft.Row([create_btn("4", num_click), create_btn("5", num_click), create_btn("6", num_click)], alignment="center", spacing=50),
                ft.Row([create_btn("7", num_click), create_btn("8", num_click), create_btn("9", num_click)], alignment="center", spacing=50),
                ft.Row([
                    ft.Container(bgcolor="#FF4D4D", width=150, height=150, border_radius=75, on_click=backspace_click), 
                    create_btn("0", num_click), 
                    ft.Container(bgcolor="#5CB85C", width=150, height=150, border_radius=75, on_click=submit_click), 
                ], alignment="center", spacing=50),
            ], spacing=35, alignment="center"),
            top=360, right=150
        )

        # ปุ่มย้อนกลับ
        back_btn = get_back_btn(show_home)

        # รวม UI ของหน้าเข้าสู่ระบบเจ้าหน้าที่
        staff_login_stack = ft.Stack([top_banner, login_label, input_field, keypad, back_btn], width=1920, height=1080)
        page.add(staff_login_stack)
        page.update()

    # -------------------------------------------------------------------
    # หน้าสมัครสมาชิก (Register) - แสดง QR Code
    # -------------------------------------------------------------------
    def show_register(e=None):
        page.controls.clear()
        
        # พื้นหลังสีขาว
        bg_white = ft.Container(bgcolor="white", width=1920, height=1080)
        
        # แถบสีเขียวฝั่งซ้าย
        bg_green_left = ft.Container(
            bgcolor="#61B964",
            width=1000,
            height=1800,
            rotate=-0.05,
            left=-400,
            top=-300,
        )
        
        # แถบสีเขียวฝั่งขวา
        bg_green_right = ft.Container(
            bgcolor="#61B964",
            width=1000,
            height=1800,
            rotate=-0.05,
            right=-400,
            top=-300,
        )
        
        # แถบสีขาวซ้ายสุด สำหรับรองรับปุ่มย้อนกลับให้มองเห็นชัดเจน
        bg_white_left_bar = ft.Container(
            bgcolor="white",
            width=220,
            height=1080,
            left=0, top=0
        )
        
        # รูปภาพ QR Code ตรงกลางหน้าจอ
        qr_image = ft.Container(
            content=ft.Image(src="qr-code.jpg", width=600, height=600, fit="contain"),
            alignment=ft.Alignment(0, 0),
            left=660, top=240
        )
        
        # ปุ่มย้อนกลับ
        back_btn = get_back_btn(show_home)
        
        # รวม UI ของหน้าสมัครสมาชิก
        register_stack = ft.Stack([
            bg_white, 
            bg_green_left, 
            bg_green_right, 
            bg_white_left_bar,
            qr_image,
            back_btn
        ], width=1920, height=1080)
        
        page.add(register_stack)
        page.update()

    # -------------------------------------------------------------------
    # หน้าตั้งค่าระบบ (Staff Dashboard) - สำหรับตั้งค่าแต้มและราคา
    # -------------------------------------------------------------------
    def show_staff_dashboard(e=None):
        page.controls.clear()
        
        # พื้นหลังสีขาว
        bg_white = ft.Container(bgcolor="white", width=1920, height=1080)
        
        # แถบสีเขียวแนวตั้งตรงกลาง
        vertical_bar = ft.Container(bgcolor="#61B964", width=60, height=1080, left=420, top=0)
        
        # ฟังก์ชันสร้างปุ่มชนิดขวด (ใส, ทึบ, ขุ่น)
        def bottle_btn(text, top_pos):
            return ft.Container(
                content=ft.Text(text, size=60, color="white", weight="bold"),
                bgcolor="#5CB85C",
                border=ft.Border(
                    top=ft.BorderSide(6, "white"),
                    bottom=ft.BorderSide(6, "white"),
                    left=ft.BorderSide(6, "white"),
                    right=ft.BorderSide(6, "white")
                ),
                width=400, height=140,
                border_radius=20,
                alignment=ft.Alignment(0, 0),
                left=250, top=top_pos
            )
            
        # สร้างปุ่มประเภทขวด
        btn_clear = bottle_btn("ขวดใส", 200)
        btn_opaque = bottle_btn("ขวดทึบ", 450)
        btn_trans = bottle_btn("ขวดขุ่น", 700)
        
        # หัวตาราง (แต้ม/กรัม และ บาท/กรัม)
        header_points = ft.Text("แต้ม/กรัม", size=60, color="#0E9F14", weight="bold")
        header_baht = ft.Text("บาท/กรัม", size=60, color="#0E9F14", weight="bold")
        
        # แถวหัวตาราง
        headers = ft.Container(
            content=ft.Row([
                ft.Container(content=header_points, width=400, alignment=ft.Alignment(0,0)),
                ft.Container(content=header_baht, width=400, alignment=ft.Alignment(0,0))
            ], spacing=100),
            left=800, top=80
        )
        
        # ฟังก์ชันสร้างช่องใส่ตัวเลข (ราคา/แต้ม)
        def value_box(val_text, top_pos, left_pos):
            return ft.Container(
                content=ft.Text(val_text, size=70, color="#0E9F14", weight="bold"),
                bgcolor="white",
                border=ft.Border(
                    top=ft.BorderSide(6, "#5CB85C"),
                    bottom=ft.BorderSide(6, "#5CB85C"),
                    left=ft.BorderSide(6, "#5CB85C"),
                    right=ft.BorderSide(6, "#5CB85C")
                ),
                border_radius=20,
                width=400, height=140,
                alignment=ft.Alignment(0, 0),
                left=left_pos, top=top_pos
            )
            
        # สร้างช่องข้อมูลแถวที่ 1 (ขวดใส)
        val_clear_pt = value_box("10", 200, 800)
        val_clear_baht = value_box("0.008", 200, 1300)
        
        # สร้างช่องข้อมูลแถวที่ 2 (ขวดทึบ)
        val_opaque_pt = value_box("12", 450, 800)
        val_opaque_baht = value_box("0.01", 450, 1300)
        
        # สร้างช่องข้อมูลแถวที่ 3 (ขวดขุ่น)
        val_trans_pt = value_box("4", 700, 800)
        val_trans_baht = value_box("0.0003", 700, 1300)
        
        # ปุ่มย้อนกลับ
        back_btn = get_back_btn(show_staff_login)
        
        # รวม UI ของหน้าตั้งค่าระบบ
        dashboard_stack = ft.Stack([
            bg_white, 
            vertical_bar, 
            btn_clear, btn_opaque, btn_trans,
            headers,
            val_clear_pt, val_clear_baht,
            val_opaque_pt, val_opaque_baht,
            val_trans_pt, val_trans_baht,
            back_btn
        ], width=1920, height=1080)
        
        page.add(dashboard_stack)
        page.update()

    # เริ่มหน้าแรก
    show_home()

# รันแอปพลิเคชัน
if __name__ == "__main__":
    if hasattr(ft, "run"):
        ft.run(main, assets_dir="assets")
    else:
        try:
            ft.app(target=main, assets_dir="assets")
        except AttributeError:
            ft.app(main, assets_dir="assets")
