#!/usr/bin/env python3

import sys
import json
import importlib.util
import os

def load_test_module(test_py_path):
    # モジュールのディレクトリをsys.pathに追加して、相対インポートを可能にする
    module_dir = os.path.dirname(os.path.abspath(test_py_path))
    if module_dir not in sys.path:
        sys.path.insert(0, module_dir)

    spec = importlib.util.spec_from_file_location("test", test_py_path)
    test_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(test_module)
    return test_module

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "test.py path not provided"}))
        sys.exit(1)

    test_py_path = sys.argv[1]

    # 標準入力からファイル内容を読み取る
    file_content = sys.stdin.read()

    try:
        # デバッグ出力を抑制するために、一時的にstdoutをリダイレクト
        import io
        import contextlib

        # test.pyをロード
        test_module = load_test_module(test_py_path)

        # receiveFileAndReturnComment関数を呼び出す
        # デバッグ出力をキャプチャして捨てる
        debug_output = io.StringIO()
        with contextlib.redirect_stdout(debug_output):
            result = test_module.receiveFileAndReturnComment(file_content)

        # 結果をJSON形式で出力（この出力だけが標準出力に行く）
        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        # エラーが発生した場合もJSON形式で返す
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
