<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\ActivityLog;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Validasi
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 2. Cek apakah email terdaftar
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'success'    => false,
                'error_type' => 'email',
                'message'    => 'Email tidak ditemukan. Pastikan email yang Anda masukkan benar.'
            ], 401);
        }

        // 3. Cek password
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'success'    => false,
                'error_type' => 'password',
                'message'    => 'Password yang Anda masukkan salah.'
            ], 401);
        }

        // 3. Ambil User
        $user = User::with('unitKerja')->where('email', $request->email)->firstOrFail();

        // 4. Buat Token
        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'LOGIN',
            'description' => $user->username . ' berhasil login.',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login Berhasil',
            'data' => [
                'token' => $token,
                'user' => $user,
                'permissions' => $user->getPermissions()
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        // 1. Ambil user yang sedang request logout
        $user = $request->user();

        // 2. CATAT LOG: User melakukan logout
        // Pastikan namespace ActivityLog sudah di-import di atas
        \App\Models\ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'LOGOUT',
            'description' => $user->username . ' keluar dari sistem.',
        ]);

        // 3. Hapus Token (Agar token lama tidak bisa dipakai lagi)
        // Ini adalah cara resmi logout di Sanctum
        $user->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout Berhasil'
        ], 200);
    }
}