import flet as ft
import requests
import time
import threading
import json
import os
from ai_detector import BottleDetector

def main(page: ft.Page):
    # ตั้งค่าหน้าต่างโปรแกรมหลัก
    page.title = "Transform Waste into Renewable Trust"
    page.window.width = 1920    
    page.window.height = 1080
    page.padding = 0
    page.bgcolor = "#E6FBF2" # สีพื้นหลังใหม่ (Light Mint)
    page.theme_mode = ft.ThemeMode.LIGHT
    page.window.resizable = False

    page.detector = BottleDetector()

    # ฟังก์ชันสร้างปุ่มย้อนกลับสไตล์ใหม่ (Modern Button แทนรูปภาพ)
    def get_back_btn(on_click_action):
        return ft.Container(
            content=ft.Row([
                ft.Image(src="back.png", width=30, height=30),
                ft.Text("กลับ", size=30, color="#064E3B", weight="bold")
            ], spacing=10),
            bgcolor="white",
            padding=ft.Padding(left=20, right=30, top=15, bottom=15),
            border_radius=30,
            bottom=40, left=40,
            on_click=on_click_action
        )

    # -------------------------------------------------------------------
    # หน้าแรก (Home) - สำหรับกรอกหมายเลขสมาชิก
    # -------------------------------------------------------------------
    def show_home(e=None):
        page.controls.clear()
        
        if getattr(page, 'detector', None):
            page.detector.stop()
        
        # ข้อความต้อนรับด้านซ้าย (Hero Section)
        hero_text = ft.Container(
            content=ft.Column(
                [
                    ft.Row([
                        ft.Text("♻", size=48, color="#38A169"),
                        ft.Text("EcoCycle Pro", size=40, color="#064E3B", weight="bold")
                    ], spacing=15),
                    ft.Container(height=60),
                    ft.Container(
                        content=ft.Text("Smart Recycling Infrastructure", size=20, color="#38A169", weight="bold"),
                        bgcolor="#E6FBF2", padding=ft.Padding(left=20, right=20, top=8, bottom=8),
                        border_radius=20, border=ft.Border(top=ft.BorderSide(2, "#38A169"), bottom=ft.BorderSide(2, "#38A169"), left=ft.BorderSide(2, "#38A169"), right=ft.BorderSide(2, "#38A169"))
                    ),
                    ft.Text("Transform Waste into\nRenewable Trust", size=80, color="#064E3B", weight="bold"),
                    ft.Container(height=20),
                    ft.Text("EcoCycle Pro is the leading automated reverse vending\nsystem. We turn everyday plastic bottles into rewards,\ncreating a seamless, gamified recycling experience.", size=28, color="#4A5568"),
                ],
                spacing=20
            ),
            left=150, top=250
        )
        
        # ตัวแปรเก็บหมายเลขสมาชิกที่กรอก
        member_number = ft.Text(value="", size=48, color="#064E3B", weight="bold", text_align="center")

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
                payload = {"phonenumber": member_number.value}
                try:
                    response = requests.post("http://127.0.0.1/bottle_api/api/user/machines/1/login", json=payload)
                    if response.status_code == 200:
                        res_data = response.json()
                        page.user_token = res_data['token']
                        page.member_data = res_data['data']
                        show_action_menu(e)
                    else:
                        snack = ft.SnackBar(ft.Text("ไม่พบหมายเลขนี้ในระบบ โปรดสมัครสมาชิก", size=30), bgcolor="#E53E3E", open=True)
                        page.overlay.append(snack)
                        member_number.value = ""
                        member_number.update()
                        page.update()
                except Exception as ex:
                    print(f"API Error: {ex}")
                    snack = ft.SnackBar(ft.Text("ไม่สามารถเชื่อมต่อฐานข้อมูลได้", size=30), bgcolor="#E53E3E", open=True)
                    page.overlay.append(snack)
                    member_number.value = ""
                    member_number.update()
                    page.update()

        # ฟังก์ชันสร้างปุ่มตัวเลขบนแป้นพิมพ์ (สไตล์คลีน)
        def create_btn(text, on_click, bg_color="#F7FAFC", text_color="#2D3748"):
            return ft.Container(
                content=ft.Text(text, size=40, color=text_color, weight="bold"),
                bgcolor=bg_color,
                width=110, height=110,
                border_radius=20,
                border=ft.Border(top=ft.BorderSide(1, "#E2E8F0"), bottom=ft.BorderSide(1, "#E2E8F0"), left=ft.BorderSide(1, "#E2E8F0"), right=ft.BorderSide(1, "#E2E8F0")) if bg_color=="#F7FAFC" else None,
                alignment=ft.Alignment(0, 0),
                on_click=on_click,
                data=text
            )

        # UI แป้นพิมพ์ตัวเลข (Keypad) ให้อยู่ใน Card สีขาว
        keypad_card = ft.Container(
            content=ft.Column([
                ft.Text("โปรดกรอกเบอร์โทรศัพท์", size=28, color="#4A5568", weight="bold"),
                ft.Container(height=10),
                # ช่องแสดงตัวเลขที่กรอก
                ft.Container(
                    content=member_number,
                    width=420, height=90,
                    bgcolor="#F7FAFC",
                    border=ft.Border(top=ft.BorderSide(2, "#E2E8F0"), bottom=ft.BorderSide(2, "#E2E8F0"), left=ft.BorderSide(2, "#E2E8F0"), right=ft.BorderSide(2, "#E2E8F0")),
                    border_radius=15,
                    alignment=ft.Alignment(0, 0)
                ),
                ft.Container(height=15),
                ft.Row([create_btn("1", num_click), create_btn("2", num_click), create_btn("3", num_click)], alignment="center", spacing=25),
                ft.Row([create_btn("4", num_click), create_btn("5", num_click), create_btn("6", num_click)], alignment="center", spacing=25),
                ft.Row([create_btn("7", num_click), create_btn("8", num_click), create_btn("9", num_click)], alignment="center", spacing=25),
                ft.Row([
                    create_btn("⌫", backspace_click, bg_color="#EDF2F7", text_color="#E53E3E"), 
                    create_btn("0", num_click), 
                    create_btn("✓", submit_click, bg_color="#38A169", text_color="white"), 
                ], alignment="center", spacing=25),
                ft.Container(height=15),
                # ปุ่มสมัครสมาชิก
                ft.Container(
                    content=ft.Text("ยังไม่เป็นสมาชิก? สมัครเลย", size=24, color="#38A169", weight="bold"),
                    on_click=lambda e: show_register(e),
                    padding=10
                )
            ], spacing=25, alignment="center", horizontal_alignment="center"),
            bgcolor="white",
            padding=ft.Padding(left=50, right=50, top=50, bottom=50),
            border_radius=30,
            top=110, right=200, width=540, height=860
        )

        # ปุ่มมุมซ้ายล่างสำหรับเจ้าหน้าที่
        staff_only = ft.Container(
            content=ft.Row([
                ft.Image(src="settings.png", width=30, height=30),
                ft.Text("Staff Login", size=20, color="#A0AEC0", weight="bold"),
            ], spacing=8),
            left=40, bottom=40,
            on_click=lambda e: show_staff_login(e)
        )

        # รวม UI ทั้งหมดของหน้าแรก
        home_stack = ft.Stack([hero_text, keypad_card, staff_only], width=1920, height=1080)
        
        page.add(home_stack)
        page.update()

    # -------------------------------------------------------------------
    # หน้าเมนูหลัก (Action Menu) - แสดงหลังจากกรอกหมายเลขสมาชิกสำเร็จ
    # -------------------------------------------------------------------
    def show_action_menu(e=None):
        page.controls.clear()
        
        # ตั้งค่าสถานะการโหลดข้อมูล loop
        page.is_polling = True
        page.session_bottles = []
        page.machine_rates = {}
        
        # ตรวจสอบข้อมูลสมาชิกใน page
        if hasattr(page, 'member_data'):
            fname = page.member_data['fname']
            lname = page.member_data['lname']
            point = page.member_data['point']
            display_user = f"{fname} {lname}"
            display_point = f"{point} แต้ม"
        else:
            display_user = "สมาชิกทั่วไป"
            display_point = "0 แต้ม"
            
        point_text_control = ft.Text(display_point, size=16, color="#48BB78", weight="bold")
            
        # Top App Bar (โลโก้ซ้าย + โปรไฟล์ขวา)
        top_bar = ft.Container(
            content=ft.Row([
                # Logo
                ft.Row([
                    ft.Text("♻", size=40, color="#38A169"),
                    ft.Text("EcoCycle Pro", size=32, color="#064E3B", weight="bold")
                ], spacing=10),
                # Profile
                ft.Container(
                    content=ft.Row([
                        ft.Text("👤", size=40),
                        ft.Column([
                            ft.Text(display_user, size=20, color="#064E3B", weight="bold"),
                            point_text_control,
                        ], spacing=0, alignment="center")
                    ], spacing=15),
                    bgcolor="white",
            padding=ft.Padding(left=20, right=30, top=10, bottom=10),
                    border_radius=40,
                )
            ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
            left=80, right=80, top=50
        )

        # ข้อความหัวข้อหลัก (ตรงกลางจอ)
        title = ft.Container(
            content=ft.Column(
                [
                    ft.Text("กรุณาใส่ขวดพลาสติกทีละขวด", size=54, color="#064E3B", weight="bold"),
                    ft.Text("เครื่องกำลังทำงานและนับจำนวนขวดของคุณ...", size=24, color="#4A5568"),
                ],
                spacing=10, horizontal_alignment="center"
            ),
            left=0, right=0, top=200, alignment=ft.Alignment(0, 0)
        )

        # กล่องแสดงจำนวนขวด (Card กลางจอ)
        bottle_count_text = ft.Text("0", size=120, color="#38A169", weight="bold")
        bottle_count_sub = ft.Text("/ 10 ขวด", size=36, color="#A0AEC0", weight="bold")
        bottle_count_box = ft.Container(
            content=ft.Column([
                ft.Text("🍾", size=80),
                ft.Row([bottle_count_text, bottle_count_sub], alignment="center", vertical_alignment="end"),
                ft.Text("จำนวนขวดที่รับแล้ว", size=24, color="#4A5568", weight="bold")
            ], horizontal_alignment="center", spacing=0, alignment="center"),
            bgcolor="white",
            border_radius=30,
            width=500, height=400,
            padding=ft.Padding(left=40, right=40, top=40, bottom=40),
            top=360, left=420
        )

        def on_ui_update(topic):
            page.update()
            
        page.pubsub.subscribe(on_ui_update)
        
        # คอนเทนเนอร์สำหรับปุ่มแลกรางวัล (ขวาของกล่องขวด)
        reward_btn_container = ft.Container(top=360, left=1000)
        
        # ฟังก์ชันสร้างปุ่มเมนูขนาดใหญ่แบบ Card
        def modern_button(btn_title, desc, icon, on_click, is_active=True):
            border_color = "#38A169" if is_active else "#E53E3E"
            icon_color = "#38A169" if is_active else "#E53E3E"
            return ft.Container(
                content=ft.Column([
                    ft.Text(icon, size=80, color=icon_color),
                    ft.Container(height=20),
                    ft.Text(btn_title, size=48, color="#064E3B" if is_active else "#E53E3E", weight="bold"),
                    ft.Text(desc, size=24, color="#4A5568"),
                ], horizontal_alignment="center", alignment="center"),
                bgcolor="white",
                border=ft.Border(top=ft.BorderSide(4, border_color), bottom=ft.BorderSide(4, border_color), left=ft.BorderSide(4, border_color), right=ft.BorderSide(4, border_color)),
                border_radius=30,
                width=500, height=400,
                padding=ft.Padding(left=40, right=40, top=40, bottom=40),
                on_click=on_click if is_active else None
            )
        
        def handle_bottle_detected(bottle_type, weight, original_class):
            if len(page.session_bottles) >= 10:
                return
                
            print(f"Bottle detected: {bottle_type}, weight: {weight}")
            
            # เล่นเสียงผ่าน Windows API โดยตรง (เพราะ Flet เวอร์ชันเก่าไม่มี ft.Audio)
            audio_path = os.path.abspath(f"sound/type_bottle_sound/{original_class}_th.mp3")
            if os.path.exists(audio_path):
                import ctypes
                try:
                    # ปิดไฟล์เก่าที่อาจจะเล่นค้างอยู่ก่อน
                    ctypes.windll.winmm.mciSendStringW(f'close bot_audio', None, 0, None)
                    # เปิดและเล่นไฟล์ใหม่
                    ctypes.windll.winmm.mciSendStringW(f'open "{audio_path}" type mpegvideo alias bot_audio', None, 0, None)
                    ctypes.windll.winmm.mciSendStringW(f'play bot_audio', None, 0, None)
                except Exception as e:
                    print("Audio play error:", e)
                
            rate_val = page.machine_rates.get(bottle_type, 0.0)
            earned_points = float(weight) * float(rate_val)
            
            bottle_data = {
                "type": bottle_type,
                "weight": weight,
                "earned": earned_points
            }
            
            page.session_bottles.append(bottle_data)
            bottle_count_text.value = str(len(page.session_bottles))
            page.update()
            
            # ตรวจสอบว่าครบ 10 ขวดหรือยัง ถ้าครบให้หยุดกล้องทันที
            if len(page.session_bottles) >= 10:
                print("Max 10 bottles reached for this session. Stopping AI.")
                if getattr(page, 'detector', None):
                    page.detector.stop()
                snack = ft.SnackBar(ft.Text("คุณใส่ขวดครบ 10 ขวดแล้ว กรุณากดรับรางวัล", size=30), bgcolor="#D69E2E", open=True)
                page.overlay.append(snack)
                page.update()

        if getattr(page, 'detector', None):
            page.detector.callback = handle_bottle_detected
            page.detector.start()
        
        def handle_redeem(e):
            if not page.session_bottles:
                snack = ft.SnackBar(ft.Text("คุณยังไม่ได้ใส่ขวดเลยครับ!", size=30), bgcolor="#E53E3E", open=True)
                page.overlay.append(snack)
                page.update()
                return
                
            if hasattr(page, 'user_token'):
                payload = {
                    "bottles": page.session_bottles
                }
                headers = {"Authorization": f"Bearer {page.user_token}"}
                try:
                    res = requests.post("http://127.0.0.1/bottle_api/api/user/machines/1/batch_deposit", json=payload, headers=headers)
                    try:
                        res_data = res.json()
                    except Exception as json_ex:
                        print("RAW RESPONSE:", res.text)
                        raise json_ex
                        
                    if res.status_code == 200:
                        snack = ft.SnackBar(ft.Text(res_data.get('message', "รับแต้มสำเร็จ!"), size=30), bgcolor="#38A169", open=True)
                        page.overlay.append(snack)
                        page.session_bottles = []
                        bottle_count_text.value = "0"
                        
                        # อัปเดตแต้มล่าสุดใน UI ทันที
                        if 'data' in res_data and 'total_point' in res_data['data']:
                            new_point = res_data['data']['total_point']
                            page.member_data['point'] = new_point
                            point_text_control.value = f"{new_point} แต้ม"
                            
                        # แลกแต้มเสร็จแล้ว เริ่ม AI ใหม่อีกครั้งเพื่อรับรอบต่อไป
                        if getattr(page, 'detector', None):
                            page.detector.start()
                    else:
                        error_msg = f"เกิดข้อผิดพลาดในการรับแต้ม (Code: {res.status_code})"
                        print("Error from batch_deposit:", res.status_code, res.text)
                        snack = ft.SnackBar(ft.Text(error_msg, size=30), bgcolor="#E53E3E", open=True)
                        page.overlay.append(snack)
                except Exception as ex:
                    print("API Error on batch_deposit:", ex)
                    snack = ft.SnackBar(ft.Text("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", size=30), bgcolor="#E53E3E", open=True)
                    page.overlay.append(snack)
            page.update()
            
        def poll_machine_status():
            m_id = 1
            last_m_type = None
            last_allow = None
            while getattr(page, 'is_polling', False):
                try:
                    response = requests.get(f"http://127.0.0.1/bottle_api/api/user/machines/{m_id}/status?t={time.time()}")
                    if response.status_code == 200:
                        res_data = response.json()
                        if res_data.get('status') == 'success':
                            m_data = res_data['data']
                            count = m_data['count']
                            m_type = m_data['type']
                            allow = m_data['allow']
                            rates = m_data.get('rates', {})
                            
                            page.machine_rates = rates
                            
                            # อัปเดตตัวเลขแบบ Real-time ถ้ามีข้อมูลอื่นๆ
                            page.pubsub.send_all("update")
                            # อัปเดตปุ่มตาม type เฉพาะเมื่อมีการเปลี่ยนแปลง
                            if m_type != last_m_type or allow != last_allow:
                                last_m_type = m_type
                                last_allow = allow
                                
                                title_text = reward_btn.content.controls[2]
                                desc_text = reward_btn.content.controls[3]
                                
                                if allow:
                                    if m_type == 'point':
                                        title_text.value = "สะสมแต้ม"
                                        desc_text.value = "รับแต้มพิเศษเข้าบัญชี"
                                    else:
                                        title_text.value = "รับเงินสด"
                                        desc_text.value = "รับคูปองเงินสดส่วนลด"
                                    reward_btn.on_click = handle_redeem
                                    title_text.color = "#064E3B"
                                else:
                                    title_text.value = "ปิดบริการ"
                                    desc_text.value = "ตู้ปิดรับขวดชั่วคราว"
                                    reward_btn.on_click = None
                                    title_text.color = "#E53E3E"
                                
                                page.pubsub.send_all("update")
                except Exception as ex:
                    if "destroyed session" in str(ex).lower():
                        break  # โปรแกรมถูกปิดไปแล้ว ให้ออกจาก Loop เลย
                    print(f"Polling Error: {ex}")
                time.sleep(0.5)

        # ปุ่มรับแต้ม
        reward_btn = modern_button("รับแต้ม (Redeem)", "รวมคะแนนและกลับหน้าหลัก", "🪙", handle_redeem, is_active=True)
        reward_btn_container.content = reward_btn

        def on_back(e):
            page.is_polling = False
            if getattr(page, 'detector', None):
                page.detector.stop()
            show_home(e)

        back_btn = get_back_btn(on_back)

        action_stack = ft.Stack([top_bar, title, bottle_count_box, reward_btn_container, back_btn], width=1920, height=1080)
        page.add(action_stack)
        page.update()
        
        threading.Thread(target=poll_machine_status, daemon=True).start()

    # -------------------------------------------------------------------
    # หน้าเข้าสู่ระบบเจ้าหน้าที่ (Staff Login)
    # -------------------------------------------------------------------
    def show_staff_login(e=None):
        page.controls.clear()
        
        if getattr(page, 'detector', None):
            page.detector.stop()
        
        saved_phone = None
        try:
            with open("staff_cache.json", "r") as f:
                saved_phone = json.load(f).get("staff_phone")
        except:
            pass
        
        if saved_phone:
            input_mode = ["pin"]
            staff_phone_val = [saved_phone]
            staff_pin_val = [""]
            display_text = ft.Text(value="", size=48, color="#064E3B", weight="bold")
            login_label = ft.Text("PIN Code", size=54, color="#064E3B", weight="bold")
            sub_label = ft.Text(f"เข้าสู่ระบบด้วยเบอร์: {saved_phone}\nกรุณากรอกรหัสผ่าน 4-6 หลัก", size=24, color="#4A5568")
        else:
            input_mode = ["phone"]
            staff_phone_val = [""]
            staff_pin_val = [""]
            display_text = ft.Text(value="", size=48, color="#064E3B", weight="bold")
            login_label = ft.Text("Staff Login", size=54, color="#064E3B", weight="bold")
            sub_label = ft.Text("กรุณากรอกเบอร์โทรศัพท์เจ้าหน้าที่", size=24, color="#4A5568")
        
        # ข้อความต้อนรับด้านซ้าย
        hero_text = ft.Container(
            content=ft.Column(
                [
                    ft.Row([
                        ft.Image(src="settings.png", width=64, height=64),
                    ]),
                    login_label,
                    sub_label
                ],
                spacing=10
            ),
            left=150, top=350
        )
        
        # ฟังก์ชันเมื่อกดตัวเลข
        def num_click(e):
            val = e.control.data
            if input_mode[0] == "phone" and len(staff_phone_val[0]) < 10:
                staff_phone_val[0] += val
                display_text.value = staff_phone_val[0]
            elif input_mode[0] == "pin" and len(staff_pin_val[0]) < 10:
                staff_pin_val[0] += val
                display_text.value = "*" * len(staff_pin_val[0])
            page.update()
                
        # ฟังก์ชันเมื่อกดลบ
        def backspace_click(e):
            if input_mode[0] == "phone" and len(staff_phone_val[0]) > 0:
                staff_phone_val[0] = staff_phone_val[0][:-1]
                display_text.value = staff_phone_val[0]
            elif input_mode[0] == "pin" and len(staff_pin_val[0]) > 0:
                staff_pin_val[0] = staff_pin_val[0][:-1]
                display_text.value = "*" * len(staff_pin_val[0])
            page.update()
                
        # ฟังก์ชันเมื่อกดยืนยัน
        def submit_click(e):
            if input_mode[0] == "phone":
                if staff_phone_val[0]:
                    # สลับไปกรอก PIN
                    input_mode[0] = "pin"
                    display_text.value = ""
                    login_label.value = "PIN Code"
                    sub_label.value = "กรุณากรอกรหัสผ่าน 4-6 หลัก"
                    page.update()
            elif input_mode[0] == "pin":
                if staff_pin_val[0]:
                    payload = {
                        "identifier": staff_phone_val[0],
                        "password": staff_pin_val[0]
                    }
                    try:
                        response = requests.post("http://127.0.0.1/bottle_api/api/login", json=payload)
                        if response.status_code == 200:
                            res_data = response.json()
                            if res_data.get('status') == 'success':
                                page.staff_token = res_data['token']
                                try:
                                    with open("staff_cache.json", "w") as f:
                                        json.dump({"staff_phone": staff_phone_val[0]}, f)
                                except Exception as ex:
                                    print(f"Error saving staff cache: {ex}")
                                show_staff_dashboard(e)
                            else:
                                error_msg = res_data.get('message', 'เบอร์หรือรหัสผ่านไม่ถูกต้อง')
                                snack = ft.SnackBar(ft.Text(error_msg, size=30), bgcolor="#E53E3E", open=True)
                                page.overlay.append(snack)
                                staff_pin_val[0] = ""
                                display_text.value = ""
                                if not saved_phone:
                                    input_mode[0] = "phone"
                                    staff_phone_val[0] = ""
                                    login_label.value = "Staff Login"
                                    sub_label.value = "กรุณากรอกเบอร์โทรศัพท์เจ้าหน้าที่"
                                page.update()
                        else:
                            try:
                                res_data = response.json()
                                error_msg = res_data.get('message', 'เบอร์หรือรหัสผ่านไม่ถูกต้อง')
                            except:
                                error_msg = "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์"
                            snack = ft.SnackBar(ft.Text(error_msg, size=30), bgcolor="#E53E3E", open=True)
                            page.overlay.append(snack)
                            staff_pin_val[0] = ""
                            display_text.value = ""
                            if not saved_phone:
                                input_mode[0] = "phone"
                                staff_phone_val[0] = ""
                                login_label.value = "Staff Login"
                                sub_label.value = "กรุณากรอกเบอร์โทรศัพท์เจ้าหน้าที่"
                            page.update()
                    except Exception as ex:
                        print(f"API Error: {ex}")
                        snack = ft.SnackBar(ft.Text("ไม่สามารถเชื่อมต่อฐานข้อมูลได้", size=30), bgcolor="#E53E3E", open=True)
                        page.overlay.append(snack)
                        staff_pin_val[0] = ""
                        display_text.value = ""
                        if not saved_phone:
                            input_mode[0] = "phone"
                            staff_phone_val[0] = ""
                            login_label.value = "Staff Login"
                            sub_label.value = "กรุณากรอกเบอร์โทรศัพท์เจ้าหน้าที่"
                        page.update()
            
        def create_btn(text, on_click, bg_color="#F7FAFC", text_color="#2D3748"):
            return ft.Container(
                content=ft.Text(text, size=40, color=text_color, weight="bold"),
                bgcolor=bg_color, width=110, height=110, border_radius=20,
                border=ft.Border(top=ft.BorderSide(1, "#E2E8F0"), bottom=ft.BorderSide(1, "#E2E8F0"), left=ft.BorderSide(1, "#E2E8F0"), right=ft.BorderSide(1, "#E2E8F0")) if bg_color=="#F7FAFC" else None,
                alignment=ft.Alignment(0, 0), on_click=on_click, data=text
            )

        keypad_card = ft.Container(
            content=ft.Column([
                ft.Container(
                    content=display_text,
                    width=420, height=90,
                    bgcolor="#F7FAFC",
                    border=ft.Border(top=ft.BorderSide(2, "#E2E8F0"), bottom=ft.BorderSide(2, "#E2E8F0"), left=ft.BorderSide(2, "#E2E8F0"), right=ft.BorderSide(2, "#E2E8F0")),
                    border_radius=15,
                    alignment=ft.Alignment(0, 0)
                ),
                ft.Container(height=15),
                ft.Row([create_btn("1", num_click), create_btn("2", num_click), create_btn("3", num_click)], alignment="center", spacing=25),
                ft.Row([create_btn("4", num_click), create_btn("5", num_click), create_btn("6", num_click)], alignment="center", spacing=25),
                ft.Row([create_btn("7", num_click), create_btn("8", num_click), create_btn("9", num_click)], alignment="center", spacing=25),
                ft.Row([
                    create_btn("⌫", backspace_click, bg_color="#EDF2F7", text_color="#E53E3E"), 
                    create_btn("0", num_click), 
                    create_btn("✓", submit_click, bg_color="#38A169", text_color="white"), 
                ], alignment="center", spacing=25),
            ], spacing=25, alignment="center", horizontal_alignment="center"),
            bgcolor="white",
            padding=ft.Padding(left=50, right=50, top=50, bottom=50),
            border_radius=30,
            top=160, right=200, width=540, height=760
        )

        back_btn = get_back_btn(show_home)

        staff_login_stack = ft.Stack([hero_text, keypad_card, back_btn], width=1920, height=1080)
        page.add(staff_login_stack)
        page.update()

    # -------------------------------------------------------------------
    # หน้าสมัครสมาชิก (Register) - แสดง QR Code
    # -------------------------------------------------------------------
    def show_register(e=None):
        page.controls.clear()
        
        if getattr(page, 'detector', None):
            page.detector.stop()
        
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
            width=280,
            height=1080,
            rotate=-0.05,
            left=-30, top=0
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
        
        # ดึงโหมดปัจจุบันและเรทจากฐานข้อมูล
        m_type = "point"
        db_rates = {"clear": 0.0, "opaque": 0.0, "brown": 0.0}
        try:
            response = requests.get(f"http://127.0.0.1/bottle_api/api/user/machines/1/status?t={time.time()}")
            if response.status_code == 200:
                res_data = response.json()
                if res_data.get('status') == 'success':
                    m_type = res_data['data']['type']
                    rates_obj = res_data['data'].get('rates', {})
                    if isinstance(rates_obj, dict):
                        for k, v in rates_obj.items():
                            db_rates[k] = v
        except Exception as ex:
            print(f"Error fetching machine status: {ex}")

        # เก็บเรทที่แก้ไขได้ชั่วคราวบนหน้าจอ (แยกตามโหมด)
        point_rates = {"clear": 20.0, "opaque": 15.0, "brown": 10.0}
        money_rates = {"clear": 20.0, "opaque": 15.0, "brown": 10.0}
        
        # ดึงราคากลาง (Central API)
        try:
            cen_res = requests.get(f"http://127.0.0.1/bottle_api/api/central/prices?t={time.time()}")
            if cen_res.status_code == 200:
                c_data = cen_res.json()
                if c_data.get('status') == 'success':
                    for k, v in c_data['data'].items():
                        money_rates[k] = float(v)
        except Exception as ex:
            print(f"Error fetching central prices: {ex}")

        # ถ้าเป็นโหมดแต้ม ให้ดึงเรทจากฐานข้อมูล ถ้าเป็นเงิน ให้ใช้ราคากลางที่ดึงมา
        if m_type == "point":
            point_rates = db_rates.copy()
        elif m_type == "money":
            pass # Use central API prices as editable base_prices

        current_type = [m_type]
        
        # Top App Bar
        top_bar = ft.Container(
            content=ft.Row([
                ft.Row([
                    ft.Image(src="settings.png", width=40, height=40),
                    ft.Text("Machine Configuration", size=32, color="#064E3B", weight="bold")
                ], spacing=10),
                ft.Container(
                    content=ft.Row([
                        ft.Image(src="settings.png", width=32, height=32),
                        ft.Text("Admin Central", size=24, color="#064E3B", weight="bold"),
                    ], spacing=10),
                    bgcolor="white", padding=ft.Padding(left=20, right=20, top=10, bottom=10), border_radius=20,
                )
            ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
            left=80, right=80, top=50
        )
        
        def save_settings(e):
            headers = {}
            if hasattr(page, 'staff_token'):
                headers['Authorization'] = f"Bearer {page.staff_token}"
                
            payload = {
                "type": current_type[0]
            }
            if current_type[0] == "money":
                payload["base_prices"] = money_rates
            else:
                payload["rates"] = point_rates
                
            try:
                response = requests.put("http://127.0.0.1/bottle_api/api/operator/machines/1/config", json=payload, headers=headers)
                if response.status_code == 200:
                    snack = ft.SnackBar(ft.Text("บันทึกการตั้งค่าเรียบร้อยแล้ว", size=30), bgcolor="#38A169", open=True)
                else:
                    msg = response.json().get('message', 'เกิดข้อผิดพลาดในการบันทึก')
                    snack = ft.SnackBar(ft.Text(f"Error: {msg}", size=30), bgcolor="#E53E3E", open=True)
            except Exception as ex:
                snack = ft.SnackBar(ft.Text(f"เกิดข้อผิดพลาด: {ex}", size=30), bgcolor="#E53E3E", open=True)
                
            page.overlay.append(snack)
            page.update()

        def execute_toggle(e, dlg):
            dlg.open = False
            current_type[0] = "money" if current_type[0] == "point" else "point"
            render_dashboard()
            
        def close_dlg(e, dlg):
            dlg.open = False
            page.update()

        def toggle_type(e):
            target = "Money Mode (เงินสด)" if current_type[0] == "point" else "Point Mode (สะสมแต้ม)"
            dlg = ft.AlertDialog(
                title=ft.Text("ยืนยันการเปลี่ยนโหมด", size=24, weight="bold"),
                content=ft.Text(f"คุณต้องการเปลี่ยนตู้เป็น {target} ใช่หรือไม่?\n(โปรดตรวจสอบเรทราคาและกดบันทึกอีกครั้ง)", size=20),
                actions=[
                    ft.TextButton("ยกเลิก", on_click=lambda e: close_dlg(e, dlg)),
                    ft.TextButton("ยืนยัน", on_click=lambda e: execute_toggle(e, dlg))
                ],
                actions_alignment=ft.MainAxisAlignment.END,
                shape=ft.RoundedRectangleBorder(radius=20)
            )
            page.overlay.append(dlg)
            dlg.open = True
            page.update()

        # Card สำหรับ Material Conversion Rates
        def material_row(key, title, subtitle):
            is_point = (current_type[0] == "point")
            rates_dict = point_rates if is_point else money_rates
            unit = "pts / bottle" if is_point else "baht / bottle"
            val = str(rates_dict.get(key, 0.0))
            
            tf = ft.TextField(value=val, width=150, text_size=24, bgcolor="white", border_color="#CBD5E0", visible=False)
            txt = ft.Text(val, size=28, color="#064E3B", weight="bold")
            
            val_container = ft.Container(
                content=txt,
                bgcolor="white", border=ft.Border(top=ft.BorderSide(1, "#CBD5E0"), bottom=ft.BorderSide(1, "#CBD5E0"), left=ft.BorderSide(1, "#CBD5E0"), right=ft.BorderSide(1, "#CBD5E0")), border_radius=10,
                padding=ft.Padding(left=20, right=20, top=10, bottom=10), width=150, alignment=ft.Alignment(0,0)
            )

            edit_btn = ft.Container(content=ft.Text("✏️ Edit", size=20, color="#38A169", weight="bold"), padding=10)
            save_row_btn = ft.Container(content=ft.Text("💾 Save", size=20, color="#38A169", weight="bold"), padding=10, visible=False)

            def edit_click(e):
                tf.visible = True
                val_container.visible = False
                edit_btn.visible = False
                save_row_btn.visible = True
                page.update()
                
            def save_row_click(e):
                try:
                    new_val = float(tf.value)
                    rates_dict[key] = new_val
                    txt.value = str(new_val)
                except ValueError:
                    tf.value = txt.value
                    
                tf.visible = False
                val_container.visible = True
                edit_btn.visible = True
                save_row_btn.visible = False
                page.update()

            edit_btn.on_click = edit_click
            save_row_btn.on_click = save_row_click

            return ft.Container(
                content=ft.Row([
                    ft.Row([
                        ft.Container(
                            content=ft.Text("🍾", size=30),
                            bgcolor="#C6F6D5", width=60, height=60, border_radius=30, alignment=ft.Alignment(0,0)
                        ),
                        ft.Column([
                            ft.Text(title, size=24, color="#064E3B", weight="bold"),
                            ft.Text(subtitle, size=16, color="#4A5568")
                        ], spacing=0)
                    ], spacing=20, width=400),
                    
                    ft.Row([
                        val_container,
                        tf,
                        ft.Text(unit, size=20, color="#4A5568", weight="bold", width=150),
                        edit_btn,
                        save_row_btn
                    ])
                ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                bgcolor="#E6FBF2",
                border_radius=15,
                padding=ft.Padding(left=20, right=20, top=20, bottom=20),
                margin=ft.Margin(left=0, right=0, top=0, bottom=15)
            )

        def render_dashboard():
            page.controls.clear()
            
            type_label = "Point Mode (สะสมแต้ม)" if current_type[0] == "point" else "Money Mode (เงินสด)"
            type_btn = ft.Container(
                content=ft.Text(type_label, size=24, color="white", weight="bold"),
                bgcolor="#38A169" if current_type[0] == "point" else "#2196F3",
                padding=ft.Padding(left=30, right=30, top=15, bottom=15),
                border_radius=20,
                on_click=toggle_type
            )
            
            save_btn = ft.Container(
                content=ft.Text("บันทึกข้อมูล (Save)", size=24, color="white", weight="bold"),
                bgcolor="#E53E3E",
                padding=ft.Padding(left=30, right=30, top=15, bottom=15),
                border_radius=20,
                on_click=save_settings
            )
    
            rates_card = ft.Container(
                content=ft.Column([
                    ft.Row([
                        ft.Row([
                            ft.Text("📊", size=36),
                            ft.Text("Machine Reward Configuration", size=32, color="#064E3B", weight="bold"),
                        ], spacing=15),
                        ft.Row([type_btn, save_btn], spacing=20)
                    ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                    ft.Text("Define the reward points or base cash price granted per bottle of recycled material.", size=20, color="#4A5568"),
                    ft.Container(height=30),
                    material_row("clear", "Clear PET", "High recyclability grade"),
                    material_row("opaque", "Opaque PET", "Lower recyclability grade"),
                    material_row("brown", "Brown / Tinted PET", "Medium recyclability grade"),
                ]),
                bgcolor="white",
                border_radius=30,
                padding=ft.Padding(left=50, right=50, top=50, bottom=50),
                top=200, left=200, right=200
            )
            
            back_btn = get_back_btn(show_staff_login)
            
            def do_logout(e):
                try:
                    import os
                    if os.path.exists("staff_cache.json"):
                        os.remove("staff_cache.json")
                except:
                    pass
                show_staff_login(e)
            
            logout_btn = ft.Container(
                content=ft.Row([
                    ft.Text("ออกจากระบบ (Logout)", size=20, color="#E53E3E", weight="bold")
                ]),
                bgcolor="white",
                padding=ft.Padding(left=20, right=20, top=10, bottom=10),
                border_radius=15,
                border=ft.Border(top=ft.BorderSide(2, "#E53E3E"), bottom=ft.BorderSide(2, "#E53E3E"), left=ft.BorderSide(2, "#E53E3E"), right=ft.BorderSide(2, "#E53E3E")),
                on_click=do_logout
            )
            
            dashboard_stack = ft.Stack([top_bar, rates_card, back_btn, ft.Container(content=logout_btn, right=80, top=130)], width=1920, height=1080)
            page.add(dashboard_stack)
            page.update()

        render_dashboard()

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
