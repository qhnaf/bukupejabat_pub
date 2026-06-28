<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SyncLog;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SyncLogController extends Controller
{
    public function index(Request $request)
    {
        $query = SyncLog::query();

        if ($request->has('start_date') && $request->has('end_date')) {
            // Include end_date fully by appending time if needed, or just compare dates
            $query->whereDate('date', '>=', $request->start_date)
                  ->whereDate('date', '<=', $request->end_date);
        }

        $logs = $query->orderBy('date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'method' => 'required|string',
            'status' => 'required|string',
            'detail' => 'nullable|string',
        ]);

        SyncLog::create([
            'date' => now(),
            'method' => $request->method,
            'status' => $request->status,
            'detail' => $request->detail,
        ]);

        return response()->json(['success' => true]);
    }

    public function export(Request $request)
    {
        $query = SyncLog::query();

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereDate('date', '>=', $request->start_date)
                  ->whereDate('date', '<=', $request->end_date);
        }

        $logs = $query->orderBy('date', 'desc')->get();

        $fileName = 'log_sinkronisasi_' . date('Ymd_His') . '.csv';

        $headers = array(
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        );

        $columns = ['Tanggal', 'Waktu', 'Metode', 'Status', 'Detail'];

        $callback = function() use($logs, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($logs as $log) {
                $row['Tanggal']  = date('Y-m-d', strtotime($log->date));
                $row['Waktu']    = date('H:i:s', strtotime($log->date));
                $row['Metode']   = $log->method;
                $row['Status']   = $log->status;
                $row['Detail']   = $log->detail;

                fputcsv($file, array($row['Tanggal'], $row['Waktu'], $row['Metode'], $row['Status'], $row['Detail']));
            }

            fclose($file);
        };

        return new StreamedResponse($callback, 200, $headers);
    }
}
